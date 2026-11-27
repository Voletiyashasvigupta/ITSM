package com.example.problem_service.service;

/**
 * Exception thrown when a requested problem entity cannot be located by ID.
 *
 * <p><b>Purpose:</b> Distinct domain exception signaling missing problem records.
 *
 * <p><b>Downstream / Workflow:</b> Caught by {@link com.example.problem_service.exception.GlobalExceptionHandler#handleNotFound(ProblemNotFoundException)}
 * and translated to an HTTP 404 response.
 */
public class ProblemNotFoundException extends RuntimeException {

    /**
     * Constructs the exception with a descriptive error message.
     *
     * @param message Detail message.
     */
    public ProblemNotFoundException(String message) {
        super(message);
    }

}