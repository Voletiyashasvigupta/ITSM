package com.northstar.request.service;

import com.northstar.request.client.AuthServiceClient;
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

/**
 * Service managing idempotent request submissions, gateway identity verification, and validation.
 *
 * <p><b>Purpose:</b> Enforces core business submission policies:
 * <ul>
 *   <li>Validates Idempotency-Key headers and returns existing records on identical retries, or 409 Conflict on payload mismatch.</li>
 *   <li>Enforces that gateway-injected {@code X-Authenticated-User} matches the verified JWT subject.</li>
 *   <li>Resolves requested-for beneficiary identities, restricting on-behalf submissions to MANAGER_ADMIN users.</li>
 *   <li>Validates required form fields by service type (e.g. "Request a device" requires item and reason).</li>
 *   <li>Delegates creation to {@link RequestSubmissionWriter}.</li>
 * </ul>
 *
 * <p><b>Downstream / Workflow:</b> Called by {@link com.northstar.request.controller.RequestController#submit}.
 */
@Service
public class RequestSubmissionService {
    private final ServiceRequestRepository requests;
    private final RequestSubmissionWriter writer;
    private final AuthServiceClient authClient;

    /**
     * Constructs RequestSubmissionService.
     *
     * @param requests Service request repository.
     * @param writer Transactional writer component.
     * @param authClient Authentication service client for hierarchy resolution.
     */
    public RequestSubmissionService(ServiceRequestRepository requests, RequestSubmissionWriter writer, AuthServiceClient authClient) {
        this.requests = requests;
        this.writer = writer;
        this.authClient = authClient;
    }

    /**
     * Processes and validates an idempotent request submission.
     *
     * @param idempotencyKey Client idempotency key.
     * @param authenticatedUserId Verified JWT subject ID.
     * @param roles Collection of user role names.
     * @param gatewayIdentity Gateway forwarded user identity.
     * @param input Request form inputs.
     * @return RequestSubmissionResponse DTO.
     */
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

        // Route approval to employee's assigned personal manager, handling employees without a manager safely
        String resolvedApproverId = input.approverId();
        if (resolvedApproverId == null || resolvedApproverId.isBlank() || "auto".equalsIgnoreCase(resolvedApproverId.trim())) {
            resolvedApproverId = authClient.getPersonalManagerId(requestedForId);
        }
        if (resolvedApproverId == null || resolvedApproverId.isBlank()) {
            // Safe fallback when employee has no personal manager assigned
            resolvedApproverId = "ADMIN_TRIAGE";
        } else {
            resolvedApproverId = resolvedApproverId.trim();
        }

        RequestSubmission authorizedInput = new RequestSubmission(
                input.serviceName(), input.description(), requestedForId, resolvedApproverId, input.fields());
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
        String service = input.serviceName().trim();

        if ("Asset purchase".equalsIgnoreCase(service) || "Purchase an asset".equalsIgnoreCase(service)) {
            boolean hasCategory = (fields.get("assetCategory") != null && !fields.get("assetCategory").isBlank())
                    || (fields.get("assetType") != null && !fields.get("assetType").isBlank());
            if (!hasCategory) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required request fields: assetType or assetCategory");
            }
            if (fields.get("assetModel") == null || fields.get("assetModel").isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required request fields: assetModel");
            }
            if (fields.get("reason") == null || fields.get("reason").isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required request fields: reason");
            }
            // Quantity validation if present
            if (fields.get("quantity") != null && !fields.get("quantity").isBlank()) {
                try {
                    int qty = Integer.parseInt(fields.get("quantity").replace("+", "").trim());
                    if (qty <= 0) throw new NumberFormatException();
                } catch (NumberFormatException e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Field 'quantity' must be a positive integer");
                }
            }
            // Conditional validation: if isExpedited is true, expeditedJustification is required
            if ("true".equalsIgnoreCase(fields.get("isExpedited"))) {
                String expeditedJust = fields.get("expeditedJustification");
                if (expeditedJust == null || expeditedJust.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expedited shipping justification is required when expedited priority is requested");
                }
            }
        } else {
            java.util.List<String> required = switch (service) {
                case "Request a device" -> java.util.List.of("item", "reason");
                case "Access and accounts" -> java.util.List.of("accessType", "reason");
                case "Workplace services" -> java.util.List.of("requestType", "reason");
                case "People support" -> java.util.List.of("topic", "reason");
                default -> java.util.List.of("reason");
            };
            var missing = required.stream().filter(key -> fields.get(key) == null || fields.get(key).isBlank()).toList();
            if (!missing.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Missing required request fields: " + String.join(", ", missing));
        }

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
