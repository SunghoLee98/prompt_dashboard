package com.promptdriver.dto.response

import java.time.LocalDateTime

data class UserResponse(
    val id: Long,
    val email: String,
    val nickname: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class AuthorResponse(
    val id: Long,
    val nickname: String
)