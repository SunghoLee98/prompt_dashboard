package com.promptdriver.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener::class)
data class Notification(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    val recipient: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = true)
    val sender: User? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val type: NotificationType,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", length = 50)
    val entityType: NotificationEntityType? = null,

    @Column(name = "entity_id")
    val entityId: Long? = null,

    @Column(nullable = false, length = 200)
    val title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val message: String,

    @Column(name = "is_read", nullable = false)
    var isRead: Boolean = false,

    @Column(name = "read_at")
    var readAt: LocalDateTime? = null,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun markAsRead() {
        if (!isRead) {
            isRead = true
            readAt = LocalDateTime.now()
        }
    }

    fun markAsUnread() {
        isRead = false
        readAt = null
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as Notification
        return id == other.id
    }

    override fun hashCode(): Int {
        return id.hashCode()
    }
}

enum class NotificationType {
    NEW_PROMPT_FROM_FOLLOWED,
    USER_FOLLOWED,
    PROMPT_LIKED,
    PROMPT_RATED,
    PROMPT_BOOKMARKED,
    SYSTEM_ANNOUNCEMENT
}

enum class NotificationEntityType {
    USER,
    PROMPT,
    RATING,
    BOOKMARK
}