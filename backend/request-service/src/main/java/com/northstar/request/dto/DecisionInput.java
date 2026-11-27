package com.northstar.request.dto;

import jakarta.validation.constraints.Size;

/**
 * Data transfer record capturing an approver's decision on a service request.
 *
 * <p><b>Purpose:</b> Binds decision comments (mandatory on rejection, up to 2000 chars), decision string,
 * and boolean approval flag.
 *
 * <p><b>Downstream / Workflow:</b> Received by {@code POST /api/approvals/{id}/approve} and {@code POST /api/approvals/{id}/reject}.
 */
public record DecisionInput(
    @Size(max = 2000) String comment,
    String decision,
    Boolean approved
) {
    /**
     * Convenience constructor accepting just a decision comment.
     *
     * @param comment Comment text.
     */
    public DecisionInput(String comment) {
        this(comment, null, null);
    }
}
