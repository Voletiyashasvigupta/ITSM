package com.itsm.changemanagement.exception;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

/**
 * Controller advice for handling exceptions and mapping them to standardized JSON error responses.
 *
 * <p><b>Purpose:</b> Catches domain and validation exceptions, outputting structured error payloads with timestamp and HTTP status.
 *
 * <p><b>Downstream / Workflow:</b> Intercepts exceptions originating from change management controllers.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles 404 Not Found exceptions.
     *
     * @param e Exception instance.
     * @return 404 response entity.
     */
    @ExceptionHandler(ApiExceptions.NotFound.class)
    ResponseEntity<?> nf(RuntimeException e) {
        return err(404, e.getMessage());
    }

    /**
     * Handles 409 Conflict exceptions.
     *
     * @param e Exception instance.
     * @return 409 response entity.
     */
    @ExceptionHandler(ApiExceptions.Conflict.class)
    ResponseEntity<?> cf(RuntimeException e) {
        return err(409, e.getMessage());
    }

    /**
     * Handles 400 Bad Request invalid exceptions.
     *
     * @param e Exception instance.
     * @return 400 response entity.
     */
    @ExceptionHandler({ApiExceptions.Invalid.class, IllegalArgumentException.class})
    ResponseEntity<?> iv(RuntimeException e) {
        return err(400, e.getMessage());
    }

    /**
     * Handles bean validation failures.
     *
     * @param e Validation exception.
     * @return 400 response entity with field map.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> val(MethodArgumentNotValidException e) {
        Map<String, String> f = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(x -> f.put(x.getField(), x.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("timestamp", Instant.now(), "status", 400, "error", "Validation failed", "fields", f));
    }

    /**
     * Fallback handler for uncaught server errors.
     *
     * @param e Generic exception.
     * @return 500 response entity.
     */
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> other(Exception e) {
        e.printStackTrace();
        return err(500, "Unexpected server error: " + e.getClass().getName() + " - " + e.getMessage());
    }

    private ResponseEntity<?> err(int s, String m) {
        return ResponseEntity.status(s).body(Map.of("timestamp", Instant.now(), "status", s, "error", m));
    }
}
