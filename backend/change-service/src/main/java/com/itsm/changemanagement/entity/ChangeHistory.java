package com.itsm.changemanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA entity recording immutable audit log events for change requests in {@code change_history}.
 *
 * <p><b>Purpose:</b> Maintains regulatory audit trails: previous status, new status, action performed,
 * user who executed the action, review comments, and event timestamp.
 *
 * <p><b>Downstream / Workflow:</b> Logged by {@link com.itsm.changemanagement.service.ChangeService} on every state
 * change or review action and retrieved for historical audit views.
 */
@Entity
@Table(name = "change_history")
public class ChangeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long changeId;
    private String previousStatus;
    private String newStatus;
    private String actionPerformed;
    private String performedBy;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "event_time")
    private LocalDateTime timestamp = LocalDateTime.now();

    /** Default constructor for JPA. */
    public ChangeHistory() {}

    /**
     * Constructs a populated change history record.
     *
     * <p><b>Purpose:</b> Creates an audit log entry for a change event.
     *
     * @param id Target change ID.
     * @param p Previous status label.
     * @param n New status label.
     * @param a Action performed.
     * @param by User who performed the action.
     * @param c Comments or reason notes.
     */
    public ChangeHistory(Long id, String p, String n, String a, String by, String c) {
        this.changeId = id;
        this.previousStatus = p;
        this.newStatus = n;
        this.actionPerformed = a;
        this.performedBy = by;
        this.comments = c;
    }

    public Long getId() { return id; }
    public Long getChangeId() { return changeId; }
    public String getPreviousStatus() { return previousStatus; }
    public String getNewStatus() { return newStatus; }
    public String getActionPerformed() { return actionPerformed; }
    public String getPerformedBy() { return performedBy; }
    public String getComments() { return comments; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
