package com.foody.tracker.order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    private static final String ORDER_BODY = """
            {"customerName":"Joao","customerPhone":"(11) 99999-0000","deliveryAddress":"Rua A, 10",
             "deliveryComplement":"Apto 12, portao azul",
             "items":[{"name":"Pizza","quantity":2,"unitPrice":39.90},{"name":"Soda","quantity":1,"unitPrice":6.00}]}""";

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

    private long createOrder() throws Exception {
        String body = mvc.perform(post("/api/orders").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(body);
        m.find();
        return Long.parseLong(m.group(1));
    }

    private org.springframework.test.web.servlet.ResultActions changeStatus(long id, String status) throws Exception {
        return mvc.perform(patch("/api/orders/" + id + "/status").header("Authorization", bearer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + status + "\"}"));
    }

    @Test
    void createsOrderWithTotalAndInitialStatus() throws Exception {
        mvc.perform(post("/api/orders").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON).content(ORDER_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RECEBIDO"))
                .andExpect(jsonPath("$.customerPhone").value("(11) 99999-0000"))
                .andExpect(jsonPath("$.deliveryComplement").value("Apto 12, portao azul"))
                .andExpect(jsonPath("$.total").value(85.8))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.allowedNextStatuses.length()").value(2));
    }

    @Test
    void rejectsInvalidOrder() throws Exception {
        mvc.perform(post("/api/orders").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customerName":"","deliveryAddress":"","items":[]}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.customerName").exists())
                .andExpect(jsonPath("$.fieldErrors.items").exists());
    }

    @Test
    void complementIsOptionalButPhoneIsRequired() throws Exception {
        mvc.perform(post("/api/orders").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customerName":"Joao","customerPhone":"11999990000","deliveryAddress":"Rua A, 10",
                                 "items":[{"name":"Pizza","quantity":1,"unitPrice":10}]}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deliveryComplement").doesNotExist());

        mvc.perform(post("/api/orders").header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customerName":"Joao","customerPhone":"abc","deliveryAddress":"Rua A, 10",
                                 "items":[{"name":"Pizza","quantity":1,"unitPrice":10}]}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.customerPhone").exists());
    }

    @Test
    void listsAndFindsOrders() throws Exception {
        long id = createOrder();
        mvc.perform(get("/api/orders").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists());
        mvc.perform(get("/api/orders/" + id).header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerName").value("Joao"));
        mvc.perform(get("/api/orders/999999").header("Authorization", bearer))
                .andExpect(status().isNotFound());
    }

    @Test
    void walksThroughTheDeliveryFlow() throws Exception {
        long id = createOrder();
        changeStatus(id, "EM_PREPARO").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EM_PREPARO"));
        changeStatus(id, "SAIU_PARA_ENTREGA").andExpect(status().isOk());
        changeStatus(id, "ENTREGUE").andExpect(status().isOk())
                .andExpect(jsonPath("$.allowedNextStatuses.length()").value(0));
    }

    @Test
    void rejectsInvalidTransitions() throws Exception {
        long id = createOrder();
        changeStatus(id, "ENTREGUE").andExpect(status().isConflict());
        changeStatus(id, "CANCELADO").andExpect(status().isOk());
        changeStatus(id, "EM_PREPARO").andExpect(status().isConflict());
        changeStatus(id, "XPTO").andExpect(status().isBadRequest());
    }

    @Test
    void errorsFollowTheProblemDetailFormat() throws Exception {
        mvc.perform(get("/api/orders/999999").header("Authorization", bearer))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.title").value("Not Found"))
                .andExpect(jsonPath("$.detail").value("Order 999999 not found"));
    }

    @Test
    void cannotCancelAnOrderThatAlreadyLeftForDelivery() throws Exception {
        long id = createOrder();
        changeStatus(id, "EM_PREPARO");
        changeStatus(id, "SAIU_PARA_ENTREGA").andExpect(status().isOk());
        changeStatus(id, "CANCELADO").andExpect(status().isConflict());
    }

    @Test
    void restoresACancelledOrder() throws Exception {
        long id = createOrder();
        changeStatus(id, "CANCELADO").andExpect(status().isOk());
        changeStatus(id, "RECEBIDO").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RECEBIDO"));
    }

    @Test
    void deliveredOrdersCannotBeChanged() throws Exception {
        long id = createOrder();
        changeStatus(id, "EM_PREPARO");
        changeStatus(id, "SAIU_PARA_ENTREGA");
        changeStatus(id, "ENTREGUE").andExpect(status().isOk());
        changeStatus(id, "RECEBIDO").andExpect(status().isConflict());
        changeStatus(id, "CANCELADO").andExpect(status().isConflict());
    }
}
