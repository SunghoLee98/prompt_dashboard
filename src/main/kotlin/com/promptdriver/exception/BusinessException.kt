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

class BookmarkNotFoundException(message: String? = "Bookmark not found") : BusinessException(ErrorCode.BOOKMARK_NOT_FOUND, message)
class BookmarkFolderNotFoundException(message: String? = "Bookmark folder not found") : BusinessException(ErrorCode.BOOKMARK_FOLDER_NOT_FOUND, message)
class BookmarkFolderLimitExceededException(message: String? = "Maximum bookmark folders limit exceeded") : BusinessException(ErrorCode.BOOKMARK_FOLDER_LIMIT_EXCEEDED, message)
class FolderNameAlreadyExistsException(message: String? = "Folder with this name already exists") : BusinessException(ErrorCode.FOLDER_NAME_ALREADY_EXISTS, message)
class SelfBookmarkNotAllowedException(message: String? = "Cannot bookmark your own prompt") : BusinessException(ErrorCode.SELF_BOOKMARK_NOT_ALLOWED, message)

// Follow-related exceptions
class SelfFollowNotAllowedException(message: String? = "Cannot follow yourself") : BusinessException(ErrorCode.SELF_FOLLOW_NOT_ALLOWED, message)
class AlreadyFollowingException(message: String? = "Already following this user") : BusinessException(ErrorCode.ALREADY_FOLLOWING, message)
class NotFollowingException(message: String? = "Not following this user") : BusinessException(ErrorCode.NOT_FOLLOWING, message)
class NotificationNotFoundException(message: String? = "Notification not found") : BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND, message)