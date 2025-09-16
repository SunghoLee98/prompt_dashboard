package com.promptdriver.dto.response

import java.time.LocalDateTime

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long
)

data class UserRegistrationResponse(
    val id: Long,
    val email: String,
    val nickname: String,
    val createdAt: LocalDateTime
)