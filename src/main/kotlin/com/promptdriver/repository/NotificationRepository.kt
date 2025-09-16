package com.promptdriver.repository

import com.promptdriver.entity.Notification
import com.promptdriver.entity.NotificationType
import com.promptdriver.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface NotificationRepository : JpaRepository<Notification, Long> {

    fun findByRecipient(recipient: User, pageable: Pageable): Page<Notification>

    fun findByRecipientAndIsRead(recipient: User, isRead: Boolean, pageable: Pageable): Page<Notification>

    fun findByRecipientAndType(recipient: User, type: NotificationType, pageable: Pageable): Page<Notification>

    fun countByRecipientAndIsRead(recipient: User, isRead: Boolean): Long

    @Query("""
        SELECT n FROM Notification n
        WHERE n.recipient = :recipient
        AND (:unreadOnly = false OR n.isRead = false)
        AND (:type IS NULL OR n.type = :type)
        ORDER BY n.createdAt DESC
    """)
    fun findByRecipientWithFilters(
        @Param("recipient") recipient: User,
        @Param("unreadOnly") unreadOnly: Boolean,
        @Param("type") type: NotificationType?,
        pageable: Pageable
    ): Page<Notification>

    @Modifying
    @Query("""
        UPDATE Notification n
        SET n.isRead = true, n.readAt = :readAt
        WHERE n.recipient = :recipient AND n.isRead = false
    """)
    fun markAllAsReadByRecipient(
        @Param("recipient") recipient: User,
        @Param("readAt") readAt: LocalDateTime = LocalDateTime.now()
    ): Int

    @Modifying
    @Query("""
        DELETE FROM Notification n
        WHERE n.recipient = :recipient AND n.id = :notificationId
    """)
    fun deleteByRecipientAndId(
        @Param("recipient") recipient: User,
        @Param("notificationId") notificationId: Long
    ): Int

    @Query("""
        SELECT n FROM Notification n
        JOIN FETCH n.recipient
        LEFT JOIN FETCH n.sender
        WHERE n.id = :id
    """)
    fun findByIdWithUsers(@Param("id") id: Long): Notification?

    @Modifying
    @Query("""
        DELETE FROM Notification n
        WHERE n.isRead = true AND n.readAt < :cutoffDate
    """)
    fun deleteOldReadNotifications(@Param("cutoffDate") cutoffDate: LocalDateTime): Int

    @Modifying
    @Query("""
        DELETE FROM Notification n
        WHERE n.isRead = false AND n.createdAt < :cutoffDate
    """)
    fun deleteOldUnreadNotifications(@Param("cutoffDate") cutoffDate: LocalDateTime): Int
}