package com.promptdriver.service

import com.promptdriver.dto.request.UpdateNotificationSettingsRequest
import com.promptdriver.dto.response.*
import com.promptdriver.entity.*
import com.promptdriver.exception.*
import com.promptdriver.repository.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val userRepository: UserRepository
) {

    /**
     * Create a new notification
     */
    fun createNotification(
        recipientId: Long,
        senderId: Long? = null,
        type: NotificationType,
        title: String,
        message: String,
        entityType: NotificationEntityType? = null,
        entityId: Long? = null
    ): Notification {
        val recipient = userRepository.findById(recipientId)
            .orElseThrow { UserNotFoundException("Recipient user not found") }

        val sender = senderId?.let {
            userRepository.findById(it)
                .orElseThrow { UserNotFoundException("Sender user not found") }
        }

        val notification = Notification(
            recipient = recipient,
            sender = sender,
            type = type,
            title = title,
            message = message,
            entityType = entityType,
            entityId = entityId
        )

        return notificationRepository.save(notification)
    }

    /**
     * Get user notifications with optional filtering
     */
    @Transactional(readOnly = true)
    fun getUserNotifications(
        userId: Long,
        unreadOnly: Boolean = false,
        type: NotificationType? = null,
        pageable: Pageable
    ): Page<NotificationResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException() }

        val notifications = notificationRepository.findByRecipientWithFilters(
            recipient = user,
            unreadOnly = unreadOnly,
            type = type,
            pageable = pageable
        )

        return notifications.map { notification ->
            NotificationResponse(
                id = notification.id,
                type = notification.type,
                title = notification.title,
                message = notification.message,
                entityType = notification.entityType,
                entityId = notification.entityId,
                sender = notification.sender?.let {
                    NotificationSenderResponse(
                        id = it.id,
                        nickname = it.nickname
                    )
                },
                isRead = notification.isRead,
                readAt = notification.readAt,
                createdAt = notification.createdAt
            )
        }
    }

    /**
     * Mark a notification as read
     */
    fun markAsRead(userId: Long, notificationId: Long) {
        val notification = notificationRepository.findById(notificationId)
            .orElseThrow { NotificationNotFoundException() }

        // Check if notification belongs to the user
        if (notification.recipient.id != userId) {
            throw ForbiddenException("Cannot mark another user's notification")
        }

        if (!notification.isRead) {
            notification.markAsRead()
            notificationRepository.save(notification)
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    fun markAllAsRead(userId: Long): Int {
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException() }

        return notificationRepository.markAllAsReadByRecipient(user, LocalDateTime.now())
    }

    /**
     * Delete a notification
     */
    fun deleteNotification(userId: Long, notificationId: Long) {
        val notification = notificationRepository.findById(notificationId)
            .orElseThrow { NotificationNotFoundException() }

        // Check if notification belongs to the user
        if (notification.recipient.id != userId) {
            throw ForbiddenException("Cannot delete another user's notification")
        }

        notificationRepository.delete(notification)
    }

    /**
     * Get unread notification count for a user
     */
    @Transactional(readOnly = true)
    fun getUnreadCount(userId: Long): UnreadCountResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException() }

        val count = notificationRepository.countByRecipientAndIsRead(user, false)

        return UnreadCountResponse(count = count)
    }

    /**
     * Create notification for new follower
     */
    fun createFollowNotification(followedUserId: Long, followerUserId: Long) {
        val follower = userRepository.findById(followerUserId)
            .orElseThrow { UserNotFoundException("Follower user not found") }

        createNotification(
            recipientId = followedUserId,
            senderId = followerUserId,
            type = NotificationType.USER_FOLLOWED,
            title = "New follower",
            message = "${follower.nickname} started following you",
            entityType = NotificationEntityType.USER,
            entityId = followerUserId
        )
    }

    /**
     * Create notification for new prompt from followed user
     */
    fun createNewPromptNotification(followerUserId: Long, authorId: Long, promptId: Long, promptTitle: String) {
        val author = userRepository.findById(authorId)
            .orElseThrow { UserNotFoundException("Author user not found") }

        val title = promptTitle.take(100) // Limit title length

        createNotification(
            recipientId = followerUserId,
            senderId = authorId,
            type = NotificationType.NEW_PROMPT_FROM_FOLLOWED,
            title = "New prompt from ${author.nickname}",
            message = "${author.nickname} published a new prompt: $title",
            entityType = NotificationEntityType.PROMPT,
            entityId = promptId
        )
    }

    /**
     * Create notification for prompt liked
     */
    fun createPromptLikedNotification(promptAuthorId: Long, likerId: Long, promptId: Long, promptTitle: String) {
        // Don't notify if user likes their own prompt
        if (promptAuthorId == likerId) {
            return
        }

        val liker = userRepository.findById(likerId)
            .orElseThrow { UserNotFoundException("Liker user not found") }

        val title = promptTitle.take(100) // Limit title length

        createNotification(
            recipientId = promptAuthorId,
            senderId = likerId,
            type = NotificationType.PROMPT_LIKED,
            title = "Your prompt was liked",
            message = "${liker.nickname} liked your prompt: $title",
            entityType = NotificationEntityType.PROMPT,
            entityId = promptId
        )
    }

    /**
     * Create notification for prompt rated
     */
    fun createPromptRatedNotification(promptAuthorId: Long, raterId: Long, promptId: Long, promptTitle: String, rating: Int) {
        // Don't notify if user rates their own prompt
        if (promptAuthorId == raterId) {
            return
        }

        val rater = userRepository.findById(raterId)
            .orElseThrow { UserNotFoundException("Rater user not found") }

        val title = promptTitle.take(100) // Limit title length
        val stars = "★".repeat(rating) + "☆".repeat(5 - rating)

        createNotification(
            recipientId = promptAuthorId,
            senderId = raterId,
            type = NotificationType.PROMPT_RATED,
            title = "Your prompt was rated",
            message = "${rater.nickname} rated your prompt \"$title\" $stars",
            entityType = NotificationEntityType.RATING,
            entityId = promptId
        )
    }

    /**
     * Create notification for prompt bookmarked
     */
    fun createPromptBookmarkedNotification(promptAuthorId: Long, bookmarkerId: Long, promptId: Long, promptTitle: String) {
        // Don't notify if user bookmarks their own prompt
        if (promptAuthorId == bookmarkerId) {
            return
        }

        val bookmarker = userRepository.findById(bookmarkerId)
            .orElseThrow { UserNotFoundException("Bookmarker user not found") }

        val title = promptTitle.take(100) // Limit title length

        createNotification(
            recipientId = promptAuthorId,
            senderId = bookmarkerId,
            type = NotificationType.PROMPT_BOOKMARKED,
            title = "Your prompt was bookmarked",
            message = "${bookmarker.nickname} bookmarked your prompt: $title",
            entityType = NotificationEntityType.BOOKMARK,
            entityId = promptId
        )
    }

    /**
     * Create system announcement
     */
    fun createSystemAnnouncement(userId: Long, title: String, message: String) {
        createNotification(
            recipientId = userId,
            senderId = null,
            type = NotificationType.SYSTEM_ANNOUNCEMENT,
            title = title,
            message = message,
            entityType = null,
            entityId = null
        )
    }

    /**
     * Cleanup old notifications
     */
    fun cleanupOldNotifications(): Int {
        val thirtyDaysAgo = LocalDateTime.now().minusDays(30)
        val ninetyDaysAgo = LocalDateTime.now().minusDays(90)

        val deletedReadCount = notificationRepository.deleteOldReadNotifications(thirtyDaysAgo)
        val deletedUnreadCount = notificationRepository.deleteOldUnreadNotifications(ninetyDaysAgo)

        return deletedReadCount + deletedUnreadCount
    }
}