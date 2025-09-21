package com.promptdriver.service

import com.promptdriver.dto.response.UnreadCountResponse
import com.promptdriver.entity.*
import com.promptdriver.exception.*
import com.promptdriver.repository.*
import io.mockk.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.data.domain.*
import java.time.LocalDateTime
import java.util.*

class NotificationServiceTest {

    private lateinit var notificationService: NotificationService
    private lateinit var notificationRepository: NotificationRepository
    private lateinit var userRepository: UserRepository

    @BeforeEach
    fun setUp() {
        notificationRepository = mockk()
        userRepository = mockk()

        notificationService = NotificationService(
            notificationRepository,
            userRepository
        )
    }

    @Test
    fun `should create notification successfully`() {
        // Given
        val recipientId = 1L
        val senderId = 2L

        val recipient = User(
            id = recipientId,
            email = "recipient@test.com",
            password = "password",
            nickname = "recipient"
        )

        val sender = User(
            id = senderId,
            email = "sender@test.com",
            password = "password",
            nickname = "sender"
        )

        val notification = Notification(
            id = 1L,
            recipient = recipient,
            sender = sender,
            type = NotificationType.USER_FOLLOWED,
            title = "New follower",
            message = "sender started following you",
            entityType = NotificationEntityType.USER,
            entityId = senderId
        )

        every { userRepository.findById(recipientId) } returns Optional.of(recipient)
        every { userRepository.findById(senderId) } returns Optional.of(sender)
        every { notificationRepository.save(any()) } returns notification

        // When
        val result = notificationService.createNotification(
            recipientId = recipientId,
            senderId = senderId,
            type = NotificationType.USER_FOLLOWED,
            title = "New follower",
            message = "sender started following you",
            entityType = NotificationEntityType.USER,
            entityId = senderId
        )

        // Then
        assertNotNull(result)
        assertEquals(NotificationType.USER_FOLLOWED, result.type)
        assertEquals("New follower", result.title)
        verify(exactly = 1) { notificationRepository.save(any()) }
    }

    @Test
    fun `should get user notifications with filtering`() {
        // Given
        val userId = 1L
        val pageable = PageRequest.of(0, 20)

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        val notification = Notification(
            id = 1L,
            recipient = user,
            sender = null,
            type = NotificationType.SYSTEM_ANNOUNCEMENT,
            title = "System Update",
            message = "System will be under maintenance",
            entityType = null,
            entityId = null
        )

        val notificationList = listOf(notification)
        val page = PageImpl(notificationList, pageable, notificationList.size.toLong())

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { notificationRepository.findByRecipientWithFilters(user, false, null, pageable) } returns page

        // When
        val result = notificationService.getUserNotifications(userId, false, null, pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(NotificationType.SYSTEM_ANNOUNCEMENT, result.content[0].type)
        assertEquals("System Update", result.content[0].title)
    }

    @Test
    fun `should mark notification as read`() {
        // Given
        val userId = 1L
        val notificationId = 1L

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        val notification = Notification(
            id = notificationId,
            recipient = user,
            sender = null,
            type = NotificationType.SYSTEM_ANNOUNCEMENT,
            title = "Test",
            message = "Test message",
            isRead = false
        )

        every { notificationRepository.findById(notificationId) } returns Optional.of(notification)
        every { notificationRepository.save(any()) } returns notification

        // When
        notificationService.markAsRead(userId, notificationId)

        // Then
        verify(exactly = 1) { notificationRepository.save(any()) }
    }

    @Test
    fun `should throw exception when marking another user's notification as read`() {
        // Given
        val userId = 1L
        val notificationId = 1L
        val otherUserId = 2L

        val otherUser = User(
            id = otherUserId,
            email = "other@test.com",
            password = "password",
            nickname = "other"
        )

        val notification = Notification(
            id = notificationId,
            recipient = otherUser,
            sender = null,
            type = NotificationType.SYSTEM_ANNOUNCEMENT,
            title = "Test",
            message = "Test message"
        )

        every { notificationRepository.findById(notificationId) } returns Optional.of(notification)

        // When & Then
        val exception = assertThrows<ForbiddenException> {
            notificationService.markAsRead(userId, notificationId)
        }

        assertEquals("Cannot mark another user's notification", exception.message)
    }

    @Test
    fun `should mark all notifications as read`() {
        // Given
        val userId = 1L

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { notificationRepository.markAllAsReadByRecipient(user, any()) } returns 5

        // When
        val result = notificationService.markAllAsRead(userId)

        // Then
        assertEquals(5, result)
        verify(exactly = 1) { notificationRepository.markAllAsReadByRecipient(user, any()) }
    }

    @Test
    fun `should delete notification`() {
        // Given
        val userId = 1L
        val notificationId = 1L

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        val notification = Notification(
            id = notificationId,
            recipient = user,
            sender = null,
            type = NotificationType.SYSTEM_ANNOUNCEMENT,
            title = "Test",
            message = "Test message"
        )

        every { notificationRepository.findById(notificationId) } returns Optional.of(notification)
        every { notificationRepository.delete(notification) } just Runs

        // When
        notificationService.deleteNotification(userId, notificationId)

        // Then
        verify(exactly = 1) { notificationRepository.delete(notification) }
    }

    @Test
    fun `should throw exception when deleting another user's notification`() {
        // Given
        val userId = 1L
        val notificationId = 1L
        val otherUserId = 2L

        val otherUser = User(
            id = otherUserId,
            email = "other@test.com",
            password = "password",
            nickname = "other"
        )

        val notification = Notification(
            id = notificationId,
            recipient = otherUser,
            sender = null,
            type = NotificationType.SYSTEM_ANNOUNCEMENT,
            title = "Test",
            message = "Test message"
        )

        every { notificationRepository.findById(notificationId) } returns Optional.of(notification)

        // When & Then
        val exception = assertThrows<ForbiddenException> {
            notificationService.deleteNotification(userId, notificationId)
        }

        assertEquals("Cannot delete another user's notification", exception.message)
    }

    @Test
    fun `should get unread notification count`() {
        // Given
        val userId = 1L

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { notificationRepository.countByRecipientAndIsRead(user, false) } returns 7L

        // When
        val result = notificationService.getUnreadCount(userId)

        // Then
        assertEquals(7L, result.count)
    }

    @Test
    fun `should create follow notification`() {
        // Given
        val followedUserId = 1L
        val followerUserId = 2L

        val followed = User(
            id = followedUserId,
            email = "followed@test.com",
            password = "password",
            nickname = "followed"
        )

        val follower = User(
            id = followerUserId,
            email = "follower@test.com",
            password = "password",
            nickname = "follower"
        )

        val notification = Notification(
            recipient = followed,
            sender = follower,
            type = NotificationType.USER_FOLLOWED,
            title = "New follower",
            message = "follower started following you",
            entityType = NotificationEntityType.USER,
            entityId = followerUserId
        )

        every { userRepository.findById(followedUserId) } returns Optional.of(followed)
        every { userRepository.findById(followerUserId) } returns Optional.of(follower)
        every { notificationRepository.save(any()) } returns notification

        // When
        notificationService.createFollowNotification(followedUserId, followerUserId)

        // Then
        verify(exactly = 1) { notificationRepository.save(any()) }
    }

    @Test
    fun `should not create notification when user likes their own prompt`() {
        // Given
        val userId = 1L
        val promptId = 1L
        val promptTitle = "Test Prompt"

        // When
        notificationService.createPromptLikedNotification(userId, userId, promptId, promptTitle)

        // Then
        verify(exactly = 0) { notificationRepository.save(any()) }
    }

    @Test
    fun `should create prompt rated notification with correct star display`() {
        // Given
        val promptAuthorId = 1L
        val raterId = 2L
        val promptId = 1L
        val promptTitle = "Test Prompt"
        val rating = 4

        val author = User(
            id = promptAuthorId,
            email = "author@test.com",
            password = "password",
            nickname = "author"
        )

        val rater = User(
            id = raterId,
            email = "rater@test.com",
            password = "password",
            nickname = "rater"
        )

        every { userRepository.findById(promptAuthorId) } returns Optional.of(author)
        every { userRepository.findById(raterId) } returns Optional.of(rater)
        every { notificationRepository.save(any()) } answers { firstArg() }

        // When
        notificationService.createPromptRatedNotification(promptAuthorId, raterId, promptId, promptTitle, rating)

        // Then
        verify(exactly = 1) {
            notificationRepository.save(withArg {
                assertTrue(it.message.contains("★★★★☆"))
            })
        }
    }

    @Test
    fun `should cleanup old notifications`() {
        // Given
        every { notificationRepository.deleteOldReadNotifications(any()) } returns 10
        every { notificationRepository.deleteOldUnreadNotifications(any()) } returns 5

        // When
        val result = notificationService.cleanupOldNotifications()

        // Then
        assertEquals(15, result)
        verify(exactly = 1) { notificationRepository.deleteOldReadNotifications(any()) }
        verify(exactly = 1) { notificationRepository.deleteOldUnreadNotifications(any()) }
    }

    @Test
    fun `should throw exception when notification not found`() {
        // Given
        val userId = 1L
        val notificationId = 999L

        every { notificationRepository.findById(notificationId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<NotificationNotFoundException> {
            notificationService.markAsRead(userId, notificationId)
        }

        assertEquals("Notification not found", exception.message)
    }

    @Test
    fun `should throw exception when recipient user not found`() {
        // Given
        val recipientId = 999L

        every { userRepository.findById(recipientId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<UserNotFoundException> {
            notificationService.createNotification(
                recipientId = recipientId,
                senderId = null,
                type = NotificationType.SYSTEM_ANNOUNCEMENT,
                title = "Test",
                message = "Test"
            )
        }

        assertEquals("Recipient user not found", exception.message)
    }
}