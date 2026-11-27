package com.northstar.request.controller;

import com.northstar.request.dto.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Global REST exception handler translating validation errors and ResponseStatusExceptions into standard JSON bodies.
 *
 * <p><b>Purpose:</b> Normalizes error representations across all Request and Approval endpoints, including timestamps and field-level validation maps.
 *
 * <p><b>Downstream / Workflow:</b> Intercepts exceptions thrown during request controller execution.
 */
@RestControllerAdvice
public class ApiErrorHandler {

    /**
     * Handles method argument validation exceptions.
     *
     * <p><b>Purpose:</b> Extracts validation error messages mapped by field name.
     *
     * @param exception Validation exception.
     * @return 400 Bad Request ResponseEntity.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> invalid(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("timestamp", Instant.now(), "status", 400, "error", "Validation failed", "fields", fields));
    }

    /**
     * Handles Spring ResponseStatusException instances.
     *
     * <p><b>Purpose:</b> Standardizes HTTP error responses with status codes and reason messages.
     *
     * @param exception ResponseStatusException instance.
     * @return Formatted ResponseEntity matching the exception's status code.
     */
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String message = exception.getReason() == null ? "Request failed" : exception.getReason();
        Map<String, String> fields = status == HttpStatus.BAD_REQUEST ? Map.of("request", message) : Map.of();
        return ResponseEntity.status(status).body(Map.of("timestamp", Instant.now(), "status", status.value(), "error", status.getReasonPhrase(), "message", message, "fields", fields));
    }
}
