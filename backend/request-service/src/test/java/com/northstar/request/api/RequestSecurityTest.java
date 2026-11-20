package com.northstar.request.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.northstar.request.config.RequestSecurityConfiguration;
import com.northstar.request.service.LocalRequestService;
import com.northstar.request.service.RequestSubmissionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.ServletWebSecurityAutoConfiguration;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.OAuth2ResourceServerAutoConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(value=RequestController.class,properties={"security.jwt.secret=test-secret-that-is-at-least-thirty-two-bytes-long", "security.jwt.issuer=test-issuer", "security.jwt.audience=test-audience"})
@Import(RequestSecurityConfiguration.class)
@ImportAutoConfiguration({SecurityAutoConfiguration.class,ServletWebSecurityAutoConfiguration.class,OAuth2ResourceServerAutoConfiguration.class})
class RequestSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean RequestSubmissionService submissions;
    @MockitoBean LocalRequestService requests;
    @MockitoBean JwtDecoder jwtDecoder;
    @Test void rejectsUnauthenticatedDirectRequestServiceCall() throws Exception {
        mvc.perform(get("/api/requests")).andExpect(status().isUnauthorized());
    }
}
