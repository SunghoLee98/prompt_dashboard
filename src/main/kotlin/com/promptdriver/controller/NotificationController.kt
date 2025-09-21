package com.promptdriver.controller

import com.promptdriver.dto.request.UpdateNotificationSettingsRequest
import com.promptdriver.dto.response.*
import com.promptdriver.entity.NotificationType
import com.promptdriver.exception.UserNotFoundException
import com.promptdriver.repository.UserRepository
import com.promptdriver.service.NotificationService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Notification management operations")
class NotificationController(
    private val notificationService: NotificationService,
    private val userRepository: UserRepository
) {

    @Operation(summary = "Get user notifications")
    @GetMapping
    fun getUserNotifications(
        @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") sort: String,
        @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") direction: String,
        @Parameter(description = "Show only unread notifications") @RequestParam(defaultValue = "false") unreadOnly: Boolean,
        @Parameter(description = "Filter by notification type") @RequestParam(required = false) type: String?,
        authentication: Authentication
    ): ResponseEntity<PageResponse<NotificationResponse>> {
        val userEmail = authentication.name
        val userId = getUserIdFromEmail(userEmail)

        val sortDirection = if (direction.lowercase() == "desc") Sort.Direction.DESC else Sort.Direction.ASC
        val pageable = PageRequest.of(page, minOf(size, 100), Sort.by(sortDirection, sort))

        val notificationType = type?.let {
            try {
                NotificationType.valueOf(it.uppercase())
            } catch (e: IllegalArgumentException) {
                null
            }
        }

        val notifications = notificationService.getUserNotifications(
            userId = userId,
            unreadOnly = unreadOnly,
            type = notificationType,
            pageable = pageable
        )

        val response = PageResponse(
            content = notifications.content,
            totalElements = notifications.totalElements,
            totalPages = notifications.totalPages,
            page = notifications.number,
            size = notifications.size,
            first = notifications.isFirst,
            last = notifications.isLast
        )

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Mark notification as read")
    @PutMapping("/{id}/read")
    fun markNotificationAsRead(
        @Parameter(description = "Notification ID") @PathVariable id: Long,
        authentication: Authentication
    ): ResponseEntity<Void> {
        val userEmail = authentication.name
        val userId = getUserIdFromEmail(userEmail)

        notificationService.markAsRead(userId, id)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "Mark all notifications as read")
    @PutMapping("/read-all")
    fun markAllNotificationsAsRead(
        authentication: Authentication
    ): ResponseEntity<Void> {
        val userEmail = authentication.name
        val userId = getUserIdFromEmail(userEmail)

        notificationService.markAllAsRead(userId)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "Delete a notification")
    @DeleteMapping("/{id}")
    fun deleteNotification(
        @Parameter(description = "Notification ID") @PathVariable id: Long,
        authentication: Authentication
    ): ResponseEntity<Void> {
        val userEmail = authentication.name
        val userId = getUserIdFromEmail(userEmail)

        notificationService.deleteNotification(userId, id)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "Get unread notification count")
    @GetMapping("/unread-count")
    fun getUnreadNotificationCount(
        authentication: Authentication
    ): ResponseEntity<UnreadCountResponse> {
        val userEmail = authentication.name
        val userId = getUserIdFromEmail(userEmail)

        val count = notificationService.getUnreadCount(userId)
        return ResponseEntity.ok(count)
    }

    @Operation(summary = "Update notification settings")
    @PutMapping("/settings")
    fun updateNotificationSettings(
        @Valid @RequestBody request: UpdateNotificationSettingsRequest,
        authentication: Authentication
    ): ResponseEntity<NotificationSettingsResponse> {
        val userEmail = authentication.name
        val userId = getUserIdFromEmail(userEmail)

        // Note: In a real implementation, these settings would be stored in a UserNotificationSettings entity
        // For now, we'll return a mock response showing the settings were updated
        val response = NotificationSettingsResponse(
            newPromptFromFollowed = request.newPromptFromFollowed,
            userFollowed = request.userFollowed,
            promptLiked = request.promptLiked,
            promptRated = request.promptRated,
            promptBookmarked = request.promptBookmarked,
            systemAnnouncements = request.systemAnnouncements,
            updatedAt = LocalDateTime.now()
        )

        return ResponseEntity.ok(response)
    }

    // Helper method to get user ID from email
    private fun getUserIdFromEmail(email: String): Long {
        val user = userRepository.findByEmail(email)
            ?: throw UserNotFoundException("User not found with email: $email")
        return user.id
    }
}