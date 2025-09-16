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
    val isLiked: Boolean? = null,
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
    val averageRating: Double,
    val ratingCount: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class LikeResponse(
    val liked: Boolean,
    val likeCount: Int
)

data class CategoryResponse(
    val id: String,
    val name: String,
    val description: String
)