package com.itsm.changemanagement.exception;
public class ApiExceptions {private ApiExceptions(){} public static class NotFound extends RuntimeException{public NotFound(String m){super(m);}}public static class Conflict extends RuntimeException{public Conflict(String m){super(m);}}public static class Invalid extends RuntimeException{public Invalid(String m){super(m);}}}
