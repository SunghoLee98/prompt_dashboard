package com.promptdriver.dto.response

import java.time.LocalDateTime

/**
 * Response DTO for bookmark folder
 */
data class BookmarkFolderResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val bookmarkCount: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

/**
 * Response DTO for bookmark toggle action
 */
data class BookmarkToggleResponse(
    val bookmarked: Boolean,
    val bookmarkCount: Int
)

/**
 * Simplified prompt info for bookmark responses
 */
data class BookmarkedPromptInfo(
    val id: Long,
    val title: String,
    val description: String,
    val category: String,
    val tags: Set<String>,
    val author: AuthorResponse,
    val likeCount: Int,
    val viewCount: Int,
    val averageRating: Double?,
    val ratingCount: Int,
    val createdAt: LocalDateTime
)

/**
 * Simplified folder info for bookmark responses
 */
data class BookmarkFolderInfo(
    val id: Long,
    val name: String
)

/**
 * Response DTO for user bookmark
 */
data class BookmarkResponse(
    val id: Long,
    val prompt: BookmarkedPromptInfo,
    val folder: BookmarkFolderInfo?,
    val createdAt: LocalDateTime
)

/**
 * Response DTO for moving bookmark
 */
data class MoveBookmarkResponse(
    val id: Long,
    val promptId: Long,
    val folderId: Long?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)