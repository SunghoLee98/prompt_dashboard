package com.promptdriver.exception

import com.promptdriver.dto.response.ErrorResponse
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.core.AuthenticationException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.http.converter.HttpMessageNotReadableException
import com.fasterxml.jackson.databind.exc.InvalidFormatException
import com.fasterxml.jackson.databind.exc.MismatchedInputException

@RestControllerAdvice
class GlobalExceptionHandler {
    
    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(
        ex: BusinessException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Business exception: ${ex.message}", ex)
        
        val errorResponse = ErrorResponse(
            status = ex.errorCode.status.value(),
            error = ex.errorCode.code,
            message = ex.message,
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, ex.errorCode.status)
    }
    
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errors = ex.bindingResult.allErrors
            .mapNotNull { error ->
                when (error) {
                    is FieldError -> "${error.field}: ${error.defaultMessage}"
                    else -> error.defaultMessage
                }
            }
            .joinToString(", ")
        
        val errorResponse = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = ErrorCode.VALIDATION_ERROR.code,
            message = errors,
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentialsException(
        ex: BadCredentialsException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            status = HttpStatus.UNAUTHORIZED.value(),
            error = ErrorCode.INVALID_CREDENTIALS.code,
            message = "Invalid email or password",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.UNAUTHORIZED)
    }
    
    @ExceptionHandler(AuthenticationException::class)
    fun handleAuthenticationException(
        ex: AuthenticationException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Authentication exception: ${ex.message}", ex)
        
        val errorResponse = ErrorResponse(
            status = HttpStatus.UNAUTHORIZED.value(),
            error = ErrorCode.UNAUTHORIZED_ACCESS.code,
            message = ex.message ?: "Authentication failed",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.UNAUTHORIZED)
    }
    
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(
        ex: AccessDeniedException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            status = HttpStatus.FORBIDDEN.value(),
            error = ErrorCode.FORBIDDEN.code,
            message = "Access denied",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.FORBIDDEN)
    }
    
    @ExceptionHandler(SelfRatingException::class)
    fun handleSelfRatingException(
        ex: SelfRatingException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            status = HttpStatus.FORBIDDEN.value(),
            error = ErrorCode.FORBIDDEN.code,
            message = ex.message ?: "You cannot rate your own prompt",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.FORBIDDEN)
    }
    
    @ExceptionHandler(UnauthorizedRatingAccessException::class)
    fun handleUnauthorizedRatingAccessException(
        ex: UnauthorizedRatingAccessException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            status = HttpStatus.FORBIDDEN.value(),
            error = ErrorCode.FORBIDDEN.code,
            message = ex.message ?: "Unauthorized access to rating",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.FORBIDDEN)
    }
    
    @ExceptionHandler(RatingAlreadyExistsException::class)
    fun handleRatingAlreadyExistsException(
        ex: RatingAlreadyExistsException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            status = HttpStatus.CONFLICT.value(),
            error = ErrorCode.RATING_ALREADY_EXISTS.code,
            message = ex.message ?: "Rating already exists",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.CONFLICT)
    }
    
    @ExceptionHandler(RatingNotFoundException::class)
    fun handleRatingNotFoundException(
        ex: RatingNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            status = HttpStatus.NOT_FOUND.value(),
            error = ErrorCode.RATING_NOT_FOUND.code,
            message = ex.message ?: "Rating not found",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.NOT_FOUND)
    }
    
    @ExceptionHandler(InvalidRatingException::class)
    fun handleInvalidRatingException(
        ex: InvalidRatingException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val errorResponse = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = ErrorCode.VALIDATION_ERROR.code,
            message = ex.message ?: "Invalid rating value",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadableException(
        ex: HttpMessageNotReadableException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val message = when (val cause = ex.cause) {
            is InvalidFormatException -> {
                val fieldName = cause.path.joinToString(".") { it.fieldName ?: "" }
                "Invalid value for field '$fieldName': ${cause.value}"
            }
            is MismatchedInputException -> {
                when {
                    cause.message?.contains("Cannot construct instance") == true -> "Invalid or missing request body"
                    cause.message?.contains("Missing required") == true -> "Missing required fields in request body"
                    else -> "Invalid request format"
                }
            }
            else -> "Invalid request format or malformed JSON"
        }
        
        val errorResponse = ErrorResponse(
            status = HttpStatus.BAD_REQUEST.value(),
            error = ErrorCode.VALIDATION_ERROR.code,
            message = message,
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.BAD_REQUEST)
    }
    
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        logger.error("Unexpected error occurred", ex)
        
        val errorResponse = ErrorResponse(
            status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            error = ErrorCode.INTERNAL_SERVER_ERROR.code,
            message = "An unexpected error occurred",
            path = request.requestURI
        )
        
        return ResponseEntity(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR)
    }
}