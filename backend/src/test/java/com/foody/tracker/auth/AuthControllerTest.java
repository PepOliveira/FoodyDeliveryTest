package com.foody.tracker.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mvc;

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@test.com";
    }

    private static String registerBody(String email) {
        return """
                {"name":"Ana","email":"%s","password":"123456"}""".formatted(email);
    }

    @Test
    void registersAndReturnsToken() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(uniqueEmail())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Ana"));
    }

    @Test
    void rejectsDuplicateEmail() throws Exception {
        String email = uniqueEmail();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerBody(email)))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerBody(email)))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsInvalidRegistration() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","email":"nope","password":"1"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void logsInWithCorrectCredentialsOnly() throws Exception {
        String email = uniqueEmail();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(registerBody(email)));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"123456"}""".formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"wrong-password"}""".formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedRoutesRequireAuthentication() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders").header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized());
    }
}
