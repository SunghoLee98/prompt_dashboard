package com.promptdriver.exception

import org.springframework.http.HttpStatus

enum class ErrorCode(
    val status: HttpStatus,
    val code: String,
    val message: String
) {
    // Authentication & Authorization
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH001", "Invalid email or password"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH002", "Invalid token"),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH003", "Token has expired"),
    UNAUTHORIZED_ACCESS(HttpStatus.UNAUTHORIZED, "AUTH004", "Unauthorized access"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH005", "Access forbidden"),
    
    // User errors
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER001", "User not found"),
    USER_ALREADY_EXISTS(HttpStatus.CONFLICT, "USER002", "User already exists with this email"),
    
    // Prompt errors
    PROMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "PROMPT001", "Prompt not found"),
    INVALID_CATEGORY(HttpStatus.BAD_REQUEST, "PROMPT002", "Invalid category"),
    
    // Rating errors
    RATING_ALREADY_EXISTS(HttpStatus.CONFLICT, "RATING001", "Rating already exists"),
    RATING_NOT_FOUND(HttpStatus.NOT_FOUND, "RATING002", "Rating not found"),
    
    // Validation errors
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VAL001", "Validation error"),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "VAL002", "Invalid input"),
    
    // General errors
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS001", "Internal server error"),
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "SYS002", "Service temporarily unavailable")
}