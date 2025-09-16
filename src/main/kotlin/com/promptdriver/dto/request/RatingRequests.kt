package com.promptdriver.dto.request

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class CreateRatingRequest(
    @field:NotNull(message = "Rating is required")
    @field:Min(value = 1, message = "Rating must be between 1 and 5")
    @field:Max(value = 5, message = "Rating must be between 1 and 5")
    val rating: Int,

    @field:Size(max = 1000, message = "Comment must not exceed 1000 characters")
    val comment: String? = null
)

data class UpdateRatingRequest(
    @field:NotNull(message = "Rating is required")
    @field:Min(value = 1, message = "Rating must be between 1 and 5")
    @field:Max(value = 5, message = "Rating must be between 1 and 5")
    val rating: Int,

    @field:Size(max = 1000, message = "Comment must not exceed 1000 characters")
    val comment: String? = null
)