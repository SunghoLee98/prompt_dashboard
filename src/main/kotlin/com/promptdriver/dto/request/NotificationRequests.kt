package com.promptdriver.dto.request

import jakarta.validation.constraints.NotNull

data class UpdateNotificationSettingsRequest(
    @field:NotNull(message = "newPromptFromFollowed setting is required")
    val newPromptFromFollowed: Boolean,

    @field:NotNull(message = "userFollowed setting is required")
    val userFollowed: Boolean,

    @field:NotNull(message = "promptLiked setting is required")
    val promptLiked: Boolean,

    @field:NotNull(message = "promptRated setting is required")
    val promptRated: Boolean,

    @field:NotNull(message = "promptBookmarked setting is required")
    val promptBookmarked: Boolean,

    @field:NotNull(message = "systemAnnouncements setting is required")
    val systemAnnouncements: Boolean
)