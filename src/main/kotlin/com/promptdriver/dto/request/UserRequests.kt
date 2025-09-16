package com.promptdriver.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class UpdateUserRequest(
    @field:NotBlank(message = "Nickname is required")
    @field:Size(min = 2, max = 30, message = "Nickname must be between 2 and 30 characters")
    @field:Pattern(
        regexp = "^[a-zA-Z0-9_]+$",
        message = "Nickname can only contain alphanumeric characters and underscores"
    )
    val nickname: String
)