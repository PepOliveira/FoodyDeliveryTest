package com.foody.tracker.seed;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest(properties = {
        "app.seed.enabled=true",
        "app.seed.demo-email=seed-demo@foody.com",
        "app.seed.demo-password=seed-demo-123"
})
@AutoConfigureMockMvc
class DemoDataSeederTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void seedsADemoUserThatCanLogInAndOrdersInEveryStatus() throws Exception {
        String login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"seed-demo@foody.com","password":"seed-demo-123"}"""))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Matcher token = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(login);
        token.find();

        mvc.perform(get("/api/orders/summary").header("Authorization", "Bearer " + token.group(1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RECEBIDO").value(2))
                .andExpect(jsonPath("$.EM_PREPARO").value(1))
                .andExpect(jsonPath("$.SAIU_PARA_ENTREGA").value(1))
                .andExpect(jsonPath("$.ENTREGUE").value(1))
                .andExpect(jsonPath("$.CANCELADO").value(1));
    }
}
