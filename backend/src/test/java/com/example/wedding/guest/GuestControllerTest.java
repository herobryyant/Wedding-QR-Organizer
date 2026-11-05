package com.example.wedding.guest;

import com.example.wedding.security.AdminAuthInterceptor;
import com.example.wedding.security.AdminAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GuestController.class)
@Import(AdminAuthInterceptor.class)
class GuestControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GuestRepository repository;

    @MockBean
    private AdminAuthService auth;

    @Test
    void lookupReturnsMatchingGuestAndTable() throws Exception {
        given(repository.searchByName("Taylor"))
                .willReturn(List.of(new Guest("Taylor Morgan", "Table 1")));

        mockMvc.perform(get("/api/public/lookup").param("name", "Taylor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Taylor Morgan"))
                .andExpect(jsonPath("$[0].tableName").value("Table 1"));
    }

    @Test
    void lookupRejectsSearchShorterThanTwoCharacters() throws Exception {
        mockMvc.perform(get("/api/public/lookup").param("name", "T"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginReturnsSessionToken() throws Exception {
        given(auth.login("sample-password")).willReturn("test-token");

        mockMvc.perform(post("/api/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"sample-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("test-token"))
                .andExpect(jsonPath("$.expiresIn").value("12 hours"));

        verify(auth).login("sample-password");
    }

    @Test
    void organizerEndpointsRejectRequestsWithoutSession() throws Exception {
        given(auth.isValid(null)).willReturn(false);

        mockMvc.perform(get("/api/admin/guests"))
                .andExpect(status().isUnauthorized());
    }
}