package com.example.problem_service.service;

public class ProblemNotFoundException extends RuntimeException {

    public ProblemNotFoundException(String message) {
        super(message);
    }

}