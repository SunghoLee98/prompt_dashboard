package com.promptdriver.exception

open class BusinessException(
    val errorCode: ErrorCode,
    override val message: String? = errorCode.message
) : RuntimeException(message)

class UserNotFoundException(message: String? = "User not found") : BusinessException(ErrorCode.USER_NOT_FOUND, message)
class UserAlreadyExistsException(message: String? = "User already exists") : BusinessException(ErrorCode.USER_ALREADY_EXISTS, message)
class InvalidCredentialsException(message: String? = "Invalid credentials") : BusinessException(ErrorCode.INVALID_CREDENTIALS, message)
class InvalidTokenException(message: String? = "Invalid token") : BusinessException(ErrorCode.INVALID_TOKEN, message)
class ExpiredTokenException(message: String? = "Token has expired") : BusinessException(ErrorCode.EXPIRED_TOKEN, message)

class PromptNotFoundException(message: String? = "Prompt not found") : BusinessException(ErrorCode.PROMPT_NOT_FOUND, message)
class UnauthorizedAccessException(message: String? = "Unauthorized access") : BusinessException(ErrorCode.UNAUTHORIZED_ACCESS, message)
class ForbiddenException(message: String? = "Access forbidden") : BusinessException(ErrorCode.FORBIDDEN, message)

class InvalidCategoryException(message: String? = "Invalid category") : BusinessException(ErrorCode.INVALID_CATEGORY, message)
class ValidationException(message: String?) : BusinessException(ErrorCode.VALIDATION_ERROR, message)