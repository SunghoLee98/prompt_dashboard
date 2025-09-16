package com.promptdriver.dto.response

import com.promptdriver.entity.NotificationEntityType
import com.promptdriver.entity.NotificationType
import java.time.LocalDateTime

data class NotificationResponse(
    val id: Long,
    val type: NotificationType,
    val title: String,
    val message: String,
    val entityType: NotificationEntityType?,
    val entityId: Long?,
    val sender: NotificationSenderResponse?,
    val isRead: Boolean,
    val readAt: LocalDateTime?,
    val createdAt: LocalDateTime
)

data class NotificationSenderResponse(
    val id: Long,
    val nickname: String
)

data class UnreadCountResponse(
    val count: Long
)

data class NotificationSettingsResponse(
    val newPromptFromFollowed: Boolean,
    val userFollowed: Boolean,
    val promptLiked: Boolean,
    val promptRated: Boolean,
    val promptBookmarked: Boolean,
    val systemAnnouncements: Boolean,
    val updatedAt: LocalDateTime
)