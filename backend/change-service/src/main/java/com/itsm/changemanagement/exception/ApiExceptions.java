package com.itsm.changemanagement.exception;

/**
 * Container class defining custom HTTP-mapped domain exceptions for Change Management.
 *
 * <p><b>Purpose:</b> Declares {@link NotFound}, {@link Conflict}, and {@link Invalid} runtime exceptions.
 *
 * <p><b>Downstream / Workflow:</b> Thrown by {@link com.itsm.changemanagement.service.ChangeService} and translated by {@link GlobalExceptionHandler}.
 */
public class ApiExceptions {
    private ApiExceptions() {}

    /** Exception thrown when an RFC or configuration record cannot be found (maps to HTTP 404). */
    public static class NotFound extends RuntimeException {
        public NotFound(String m) { super(m); }
    }

    /** Exception thrown on duplicate resources or concurrent update conflicts (maps to HTTP 409). */
    public static class Conflict extends RuntimeException {
        public Conflict(String m) { super(m); }
    }

    /** Exception thrown on illegal state transitions or validation failures (maps to HTTP 400). */
    public static class Invalid extends RuntimeException {
        public Invalid(String m) { super(m); }
    }
}
