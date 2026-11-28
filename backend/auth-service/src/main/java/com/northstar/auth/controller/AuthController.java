package com.northstar.auth.controller;

import com.northstar.auth.dto.AuthModels.AuthenticatedUser;
import com.northstar.auth.dto.AuthModels.ApproverOption;
import com.northstar.auth.dto.AuthModels.LoginInput;
import com.northstar.auth.dto.AuthModels.ManagerOption;
import com.northstar.auth.dto.AuthModels.PasswordChange;
import com.northstar.auth.dto.AuthModels.RegisterInput;
import com.northstar.auth.dto.AuthModels.RegistrationResponse;
import com.northstar.auth.dto.AuthModels.SubordinateSummary;
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

/**
 * REST controller exposing user authentication, registration, profile, and password operations.
 *
 * <p><b>Purpose:</b> Serves as the HTTP entry point for user self-service identity management:
 * registration ({@code /api/auth/register}), login ({@code /api/auth/login}), profile resolution ({@code /api/auth/me}),
 * password change ({@code /api/auth/me/password}), and approver directory listing ({@code /api/auth/approvers}).
 *
 * <p><b>Downstream / Workflow:</b> Receives requests from the React frontend forwarded through the API Gateway,
 * executes validation, and delegates business logic to {@link AuthService}.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    /**
     * Constructs the AuthController.
     *
     * <p><b>Purpose:</b> Injects the core AuthService dependency.
     *
     * <p><b>Downstream / Workflow:</b> Initialized by Spring Boot on startup.
     *
     * @param auth The AuthService bean.
     */
    public AuthController(AuthService auth) { this.auth = auth; }

    /**
     * Registers a new user account.
     *
     * <p><b>Purpose:</b> Accepts user registration details, creates an inactive account, and returns creation confirmation.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#register(RegisterInput)}. Returns HTTP 201 Created.
     *
     * @param input Validated registration input payload.
     * @return RegistrationResponse with user details and pending status.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse register(@Valid @RequestBody RegisterInput input) { return auth.register(input); }

    /**
     * Authenticates a user with email and password.
     *
     * <p><b>Purpose:</b> Checks credentials and returns a Bearer access token upon successful authentication.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#login(LoginInput)}. Returns token and user profile.
     *
     * @param input Validated login credentials.
     * @return TokenResponse with JWT and user descriptor.
     */
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginInput input) { return auth.login(input); }

    /**
     * Retrieves the profile of the currently signed-in user.
     *
     * <p><b>Purpose:</b> Returns current user identity, assigned role, and department using the verified JWT subject.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#currentUser(UUID)} and populates the frontend AuthContext.
     *
     * @param jwt Decoded JWT principal injected by Spring Security.
     * @return AuthenticatedUser profile.
     */
    @GetMapping("/me")
    public AuthenticatedUser me(@AuthenticationPrincipal Jwt jwt) { return auth.currentUser(UUID.fromString(jwt.getSubject())); }

    /**
     * Lists active manager and administrator users available to review service requests.
     *
     * <p><b>Purpose:</b> Supplies approver options for request creation forms.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#listApprovers()}.
     *
     * @return List of ApproverOption DTOs.
     */
    @GetMapping("/approvers")
    public List<ApproverOption> approvers() { return auth.listApprovers(); }

    /**
     * Lists active manager and administrator users available to be assigned as personal managers.
     *
     * <p><b>Purpose:</b> Supplies manager options for user administration and personal manager assignment.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#listManagers()}.
     *
     * @return List of ManagerOption DTOs.
     */
    @GetMapping("/managers")
    public List<ManagerOption> managers() { return auth.listManagers(); }

    /**
     * Retrieves the reporting hierarchy of subordinates for the authenticated manager.
     *
     * <p><b>Purpose:</b> Provides direct and indirect subordinates for scoping approval permissions.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#getReportingHierarchy(UUID)}.
     *
     * @param jwt Authenticated caller JWT principal.
     * @return List of SubordinateSummary DTOs.
     */
    @GetMapping("/hierarchy/subordinates")
    public List<SubordinateSummary> mySubordinates(@AuthenticationPrincipal Jwt jwt) {
        return auth.getReportingHierarchy(UUID.fromString(jwt.getSubject()));
    }

    /**
     * Updates the password of the currently authenticated user.
     *
     * <p><b>Purpose:</b> Validates current credentials and updates the account password.
     *
     * <p><b>Downstream / Workflow:</b> Calls {@link AuthService#changePassword(UUID, PasswordChange)}. Returns HTTP 204 No Content.
     *
     * @param jwt Authenticated caller JWT principal.
     * @param input Validated PasswordChange payload.
     */
    @PostMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PasswordChange input) {
        auth.changePassword(UUID.fromString(jwt.getSubject()), input);
    }
}
