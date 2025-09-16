package com.promptdriver.dto.response

import java.time.LocalDateTime

data class PromptResponse(
    val id: Long,
    val title: String,
    val description: String,
    val content: String,
    val category: String,
    val tags: Set<String>,
    val author: AuthorResponse,
    val likeCount: Int,
    val viewCount: Int,
    val bookmarkCount: Int,
    val isLiked: Boolean? = null,
    val isBookmarked: Boolean? = null,
    val averageRating: Double,
    val ratingCount: Int,
    val userRating: Int? = null,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class PromptListResponse(
    val id: Long,
    val title: String,
    val description: String,
    val content: String,
    val category: String,
    val tags: Set<String>,
    val author: AuthorResponse,
    val likeCount: Int,
    val viewCount: Int,
    val bookmarkCount: Int,
    val averageRating: Double,
    val ratingCount: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class LikeResponse(
    val liked: Boolean,
    val likeCount: Int
)

data class PromptSummaryResponse(
    val id: Long,
    val title: String,
    val description: String,
    val category: String,
    val tags: Set<String>,
    val author: AuthorResponse,
    val viewCount: Int,
    val likeCount: Int,
    val isLiked: Boolean,
    val averageRating: Double?,
    val ratingCount: Int,
    val userRating: Int?,
    val bookmarkCount: Int,
    val isPublic: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class CategoryResponse(
    val id: String,
    val name: String,
    val description: String
)