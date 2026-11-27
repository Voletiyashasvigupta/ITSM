package com.example.problem_service.exception;

import com.example.problem_service.service.ProblemNotFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Map;

import java.util.Map;

/**
 * Global REST controller advice translating domain and security exceptions into standardized JSON responses.
 *
 * <p><b>Purpose:</b> Intercepts exceptions thrown by controllers and maps them to appropriate HTTP status codes:
 * 403 Forbidden for {@link AccessDeniedException}, 404 Not Found for {@link ProblemNotFoundException},
 * and 400 Bad Request for bean validation failures.
 *
 * <p><b>Downstream / Workflow:</b> Catches unhandled controller errors and formats a uniform JSON {@code {"error": "..."}} response.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles security access denial exceptions.
     *
     * <p><b>Purpose:</b> Formats 403 Forbidden response.
     *
     * @param ex The AccessDeniedException.
     * @return 403 ResponseEntity.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(
            AccessDeniedException ex) {

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", ex.getMessage()));
    }

    /**
     * Handles problem not found exceptions.
     *
     * <p><b>Purpose:</b> Formats 404 Not Found response.
     *
     * @param ex The ProblemNotFoundException.
     * @return 404 ResponseEntity.
     */
    @ExceptionHandler(ProblemNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(
            ProblemNotFoundException ex) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }
    
    /**
     * Handles method argument validation failures.
     *
     * <p><b>Purpose:</b> Extracts the first field validation error message into an HTTP 400 Bad Request response.
     *
     * @param ex The MethodArgumentNotValidException.
     * @return 400 ResponseEntity.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .get(0)
                .getDefaultMessage();

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message));
    }
}