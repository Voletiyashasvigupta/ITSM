package com.northstar.auth.controller;

import com.northstar.auth.dto.AuthModels.AuthenticatedUser;
import com.northstar.auth.dto.AuthModels.ApproverOption;
import com.northstar.auth.dto.AuthModels.LoginInput;
import com.northstar.auth.dto.AuthModels.PasswordChange;
import com.northstar.auth.dto.AuthModels.RegisterInput;
import com.northstar.auth.dto.AuthModels.RegistrationResponse;
import com.northstar.auth.dto.AuthModels.TokenResponse;
import com.northstar.auth.service.AuthService;
import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse register(@Valid @RequestBody RegisterInput input) { return auth.register(input); }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginInput input) { return auth.login(input); }

    @GetMapping("/me")
    public AuthenticatedUser me(@AuthenticationPrincipal Jwt jwt) { return auth.currentUser(UUID.fromString(jwt.getSubject())); }

    @GetMapping("/approvers")
    public List<ApproverOption> approvers() { return auth.listApprovers(); }

    @PostMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PasswordChange input) {
        auth.changePassword(UUID.fromString(jwt.getSubject()), input);
    }
}
