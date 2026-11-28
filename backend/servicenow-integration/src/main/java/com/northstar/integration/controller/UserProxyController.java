package com.northstar.integration.controller;

import com.northstar.integration.client.ServiceNowApiClient;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for proxying user identity, organizational group membership,
 * and reporting manager provisioning to external ServiceNow.
 */
@RestController
@RequestMapping("/integration/users")
public class UserProxyController {
    private final ServiceNowApiClient client;

    private static final Map<String, String> GROUP_NAME_MAP = Map.of(
            "COMPANY_INFRASTRUCTURE", "Northstar - Company Infrastructure",
            "CORPORATE", "Northstar - Corporate",
            "GENERAL", "Northstar - General",
            "MANAGEMENT", "Northstar - Management & Administration"
    );

    private static final Map<String, String> GROUP_SYS_IDS = Map.of(
            "COMPANY_INFRASTRUCTURE", "95efa6862f3817107528118a6fa4e360",
            "CORPORATE", "c4ef66862f3817107528118a6fa4e3a1",
            "GENERAL", "eadf26862f3817107528118a6fa4e3b5",
            "MANAGEMENT", "70ff6a862f3817107528118a6fa4e377"
    );

    public UserProxyController(ServiceNowApiClient client) {
        this.client = client;
    }

    @PostMapping
    public Map<String, Object> syncUser(@RequestBody Map<String, Object> payload) {
        String username = String.valueOf(payload.getOrDefault("username", "")).trim();
        String fullName = String.valueOf(payload.getOrDefault("fullName", "")).trim();
        String email = String.valueOf(payload.getOrDefault("email", "")).trim();
        String orgGroup = String.valueOf(payload.getOrDefault("orgGroup", "GENERAL")).trim().toUpperCase();
        String managerUsername = payload.get("managerUsername") != null ? String.valueOf(payload.get("managerUsername")).trim() : null;

        if (username.isBlank()) {
            return Map.of("error", "Username is required");
        }

        Map<String, Object> result = new HashMap<>();

        // 1. Check or create in sys_user
        String userSysId = null;
        try {
            Map<String, Object> existing = client.getUserByUsername(username);
            if (existing != null && existing.get("sys_id") != null) {
                userSysId = String.valueOf(existing.get("sys_id"));
            }
        } catch (Exception ignored) {}

        if (userSysId == null) {
            String firstName = fullName.contains(" ") ? fullName.substring(0, fullName.indexOf(' ')) : fullName;
            String lastName = fullName.contains(" ") ? fullName.substring(fullName.indexOf(' ') + 1) : "";
            if (firstName.isBlank()) firstName = username;

            Map<String, Object> userPayload = new HashMap<>();
            userPayload.put("user_name", username);
            userPayload.put("first_name", firstName);
            userPayload.put("last_name", lastName);
            userPayload.put("name", fullName.isBlank() ? username : fullName);
            userPayload.put("email", email);
            userPayload.put("active", "true");

            try {
                Map<String, Object> created = client.createRecord("sys_user", userPayload);
                if (created != null && created.get("sys_id") != null) {
                    userSysId = String.valueOf(created.get("sys_id"));
                }
            } catch (Exception ex) {
                result.put("userCreationError", ex.getMessage());
            }
        }
        result.put("userSysId", userSysId);

        // 2. Assign to group in sys_user_grmember
        String targetGroupId = GROUP_SYS_IDS.getOrDefault(orgGroup, GROUP_SYS_IDS.get("GENERAL"));
        if (userSysId != null && targetGroupId != null) {
            try {
                Map<String, Object> memberPayload = new HashMap<>();
                memberPayload.put("user", userSysId);
                memberPayload.put("group", targetGroupId);
                Map<String, Object> grMember = client.createRecord("sys_user_grmember", memberPayload);
                result.put("groupMemberSysId", grMember != null ? grMember.get("sys_id") : null);
            } catch (Exception ex) {
                result.put("groupAssignmentNote", ex.getMessage());
            }
        }

        // 3. Link manager if provided
        if (userSysId != null && managerUsername != null && !managerUsername.isBlank()) {
            try {
                Map<String, Object> mgrUser = client.getUserByUsername(managerUsername);
                if (mgrUser != null && mgrUser.get("sys_id") != null) {
                    client.updateRecord("sys_user", userSysId, Map.of("manager", mgrUser.get("sys_id")));
                    result.put("managerLinked", managerUsername);
                }
            } catch (Exception ignored) {}
        }

        result.put("status", "SYNCED");
        return result;
    }

    @GetMapping("/{username}")
    public Map<String, Object> getUser(@PathVariable("username") String username) {
        return client.getUserByUsername(username);
    }
}
