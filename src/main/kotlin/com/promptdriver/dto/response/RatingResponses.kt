package com.promptdriver.dto.response

import java.time.LocalDateTime

data class RatingResponse(
    val id: Long,
    val promptId: Long,
    val userId: Long,
    val userNickname: String,
    val rating: Int,
    val comment: String? = null,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class RatingStatsResponse(
    val averageRating: Double,
    val ratingCount: Int,
    val userRating: Int? = null,
    val distribution: Map<Int, Int> = emptyMap()
)

data class CreateRatingResponse(
    val id: Long,
    val rating: Int,
    val averageRating: Double,
    val ratingCount: Int,
    val message: String = "Rating created successfully"
)

data class UpdateRatingResponse(
    val id: Long,
    val rating: Int,
    val averageRating: Double,
    val ratingCount: Int,
    val message: String = "Rating updated successfully"
)

data class DeleteRatingResponse(
    val averageRating: Double,
    val ratingCount: Int,
    val message: String = "Rating deleted successfully"
)

data class RatingCommentResponse(
    val id: Long,
    val userId: Long,
    val userNickname: String,
    val rating: Int,
    val comment: String,
    val createdAt: LocalDateTime
)