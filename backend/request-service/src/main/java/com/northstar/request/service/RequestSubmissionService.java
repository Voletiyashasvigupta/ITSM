package com.northstar.request.service;

import com.northstar.request.dto.RequestSubmission;
import com.northstar.request.dto.RequestSubmissionResponse;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.repository.ServiceRequestRepository;
import java.util.Collection;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RequestSubmissionService {
    private final ServiceRequestRepository requests;
    private final RequestSubmissionWriter writer;

    public RequestSubmissionService(ServiceRequestRepository requests, RequestSubmissionWriter writer) {
        this.requests = requests;
        this.writer = writer;
    }

    public RequestSubmissionResponse submit(String idempotencyKey, String authenticatedUserId,
            Collection<String> roles, String gatewayIdentity, RequestSubmission input) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key must contain 1 to 128 characters");
        }
        if (authenticatedUserId == null || authenticatedUserId.isBlank() || authenticatedUserId.length() > 128) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user identity is missing");
        }
        idempotencyKey = idempotencyKey.trim();
        String requesterId = authenticatedUserId.trim();
        verifyGatewayIdentity(gatewayIdentity, requesterId);
        String requestedForId = resolveRequestedFor(input.requestedForId(), requesterId, roles);
        RequestSubmission authorizedInput = new RequestSubmission(
                input.serviceName(), input.description(), requestedForId, input.approverId(), input.fields());
        validateServiceFields(authorizedInput);
        ServiceRequestEntity existing = requests.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existing != null) return existing(existing, requesterId, authorizedInput);
        try {
            return writer.create(idempotencyKey, requesterId, authorizedInput);
        } catch (DataIntegrityViolationException race) {
            ServiceRequestEntity winner = requests.findByIdempotencyKey(idempotencyKey).orElseThrow(() -> race);
            return existing(winner, requesterId, authorizedInput);
        }
    }

    private static void validateServiceFields(RequestSubmission input) {
        var fields = input.fields() == null ? java.util.Map.<String, String>of() : input.fields();
        java.util.List<String> required = switch (input.serviceName().trim()) {
            case "Request a device" -> java.util.List.of("item", "reason");
            case "Access and accounts" -> java.util.List.of("accessType", "reason");
            case "Workplace services" -> java.util.List.of("requestType", "reason");
            case "People support" -> java.util.List.of("topic", "reason");
            default -> java.util.List.of("reason");
        };
        var missing = required.stream().filter(key -> fields.get(key) == null || fields.get(key).isBlank()).toList();
        if (!missing.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Missing required request fields: " + String.join(", ", missing));
        if (fields.size() > 100 || fields.entrySet().stream().anyMatch(e -> e.getKey().length() > 100 || (e.getValue() != null && e.getValue().length() > 4000)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request fields exceed the allowed size");
        for (String key : java.util.List.of("neededBy","accessStart","accessEnd","startDate")) {
            String date=fields.get(key);
            if(date!=null&&!date.isBlank()) try { java.time.LocalDate.parse(date); }
            catch(java.time.format.DateTimeParseException invalid) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Field '"+key+"' must be an ISO calendar date"); }
        }
        if (input.approverId() == null || input.approverId().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approver must be selected");
    }

    private static void verifyGatewayIdentity(String gatewayIdentity, String authenticatedUserId) {
        if (gatewayIdentity != null && !gatewayIdentity.isBlank()
                && !gatewayIdentity.trim().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Gateway identity does not match the verified token");
        }
    }

    private static String resolveRequestedFor(String requestedForId, String requesterId, Collection<String> roles) {
        if (requestedForId == null || requestedForId.isBlank()) return requesterId;
        String normalizedRequestedForId = requestedForId.trim();
        if (normalizedRequestedForId.equals(requesterId)) return requesterId;

        boolean maySubmitOnBehalf = roles != null && roles.stream()
                .filter(role -> role != null)
                .map(role -> role.trim().toUpperCase(Locale.ROOT))
                .anyMatch("MANAGER_ADMIN"::equals);
        if (maySubmitOnBehalf) return normalizedRequestedForId;

        boolean employee = roles != null && roles.stream()
                .filter(role -> role != null)
                .map(role -> role.trim().toUpperCase(Locale.ROOT))
                .anyMatch("EMPLOYEE"::equals);
        if (employee) return requesterId;

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your role cannot submit requests on behalf of another user");
    }

    private RequestSubmissionResponse existing(ServiceRequestEntity entity, String requesterId, RequestSubmission input) {
        if (!entity.getRequesterId().equals(requesterId)
                || !entity.getServiceName().equals(input.serviceName().trim())
                || !entity.getDescription().equals(input.description().trim())
                || !entity.getRequestedForId().equals(input.requestedForId().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Idempotency key was already used for another submission");
        }
        return new RequestSubmissionResponse(entity.getId(), entity.getRequestNumber(), entity.getServiceName(), entity.getRequesterId(),
                entity.getRequestedForId(), entity.getStatus(), entity.getServiceNowNumber(), entity.getCreatedAt());
    }
}
