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
    
    // Bookmark errors
    BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "BOOKMARK001", "Bookmark not found"),
    BOOKMARK_FOLDER_NOT_FOUND(HttpStatus.NOT_FOUND, "BOOKMARK002", "Bookmark folder not found"),
    BOOKMARK_FOLDER_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "BOOKMARK003", "Maximum bookmark folders limit exceeded"),
    FOLDER_NAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "BOOKMARK004", "Folder with this name already exists"),
    SELF_BOOKMARK_NOT_ALLOWED(HttpStatus.FORBIDDEN, "BOOKMARK005", "Cannot bookmark your own prompt"),

    // Follow errors
    SELF_FOLLOW_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "FOLLOW001", "Cannot follow yourself"),
    ALREADY_FOLLOWING(HttpStatus.CONFLICT, "FOLLOW002", "Already following this user"),
    NOT_FOLLOWING(HttpStatus.NOT_FOUND, "FOLLOW003", "Not following this user"),

    // Notification errors
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTIF001", "Notification not found"),

    // General errors
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS001", "Internal server error"),
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "SYS002", "Service temporarily unavailable")
}