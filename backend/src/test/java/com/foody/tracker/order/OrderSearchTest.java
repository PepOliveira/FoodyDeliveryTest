package com.foody.tracker.order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class OrderSearchTest {

    @Autowired
    private MockMvc mvc;

    private String bearer;

    @BeforeEach
    void authenticate() throws Exception {
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ana","email":"%s@test.com","password":"123456"}""".formatted(UUID.randomUUID())))
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(body);
        m.find();
        bearer = "Bearer " + m.group(1);
    }

    private long createOrder(String customer, String phone) throws Exception {
        String body = mvc.perform(post("/api/orders").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customerName":"%s","customerPhone":"%s","deliveryAddress":"Rua A, 10",
                                 "items":[{"name":"Pizza","quantity":1,"unitPrice":10}]}""".formatted(customer, phone)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(body);
        m.find();
        return Long.parseLong(m.group(1));
    }

    private ResultActions changeStatus(long id, String status) throws Exception {
        return mvc.perform(patch("/api/orders/" + id + "/status").header("Authorization", bearer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + status + "\"}"));
    }

    private ResultActions search(String... nameValuePairs) throws Exception {
        var request = get("/api/orders").header("Authorization", bearer);
        for (int i = 0; i < nameValuePairs.length; i += 2) {
            request.param(nameValuePairs[i], nameValuePairs[i + 1]);
        }
        return mvc.perform(request);
    }

    @Test
    void searchesByCustomerNameIgnoringCase() throws Exception {
        String unique = "Zelda" + UUID.randomUUID().toString().substring(0, 8);
        createOrder(unique, "11911112222");
        search("q", unique.toUpperCase())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].customerName").value(unique));
    }

    @Test
    void searchesByPhoneDigitsRegardlessOfFormatting() throws Exception {
        createOrder("Fone Teste", "(47) 98765-4321");
        search("q", "4798765").andExpect(jsonPath("$.totalElements").value(1));
        search("q", "(47) 98765-4321").andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void searchesByOrderNumber() throws Exception {
        long id = createOrder("Numero Teste", "11933334444");
        search("q", "#" + id)
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(id));
        search("q", String.valueOf(id)).andExpect(jsonPath("$.content[0].id").value(id));
    }

    @Test
    void filtersByOneOrMoreStatuses() throws Exception {
        String unique = "Status" + UUID.randomUUID().toString().substring(0, 8);
        long first = createOrder(unique, "11955556666");
        long second = createOrder(unique, "11955556666");
        changeStatus(second, "EM_PREPARO");

        search("q", unique, "status", "RECEBIDO")
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(first));
        search("q", unique, "status", "RECEBIDO,EM_PREPARO")
                .andExpect(jsonPath("$.totalElements").value(2));
        search("q", unique, "status", "ENTREGUE")
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void paginatesNewestFirst() throws Exception {
        String unique = "Pagina" + UUID.randomUUID().toString().substring(0, 8);
        long a = createOrder(unique, "11977778888");
        long b = createOrder(unique, "11977778888");
        long c = createOrder(unique, "11977778888");

        search("q", unique, "size", "2", "page", "0")
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].id").value(c))
                .andExpect(jsonPath("$.content[1].id").value(b))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.last").value(false));
        search("q", unique, "size", "2", "page", "1")
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].id").value(a))
                .andExpect(jsonPath("$.last").value(true));
    }

    @Test
    void capsThePageSize() throws Exception {
        search("size", "100000").andExpect(jsonPath("$.size").value(100));
    }

    @Test
    void summarisesOrdersByStatus() throws Exception {
        String unique = "Resumo" + UUID.randomUUID().toString().substring(0, 8);
        createOrder(unique, "11999990001");
        long cancelled = createOrder(unique, "11999990001");
        changeStatus(cancelled, "CANCELADO");

        mvc.perform(get("/api/orders/summary").param("q", unique).header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RECEBIDO").value(1))
                .andExpect(jsonPath("$.CANCELADO").value(1))
                .andExpect(jsonPath("$.ENTREGUE").value(0))
                .andExpect(jsonPath("$.EM_PREPARO").value(0))
                .andExpect(jsonPath("$.SAIU_PARA_ENTREGA").value(0));
    }

    @Test
    void rejectsAnUnknownStatusFilter() throws Exception {
        search("status", "XPTO")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Invalid value for parameter 'status'"));
    }
}
