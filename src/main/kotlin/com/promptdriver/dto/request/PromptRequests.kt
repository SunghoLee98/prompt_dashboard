package com.promptdriver.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class PromptCreateRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(min = 5, max = 100, message = "Title must be between 5 and 100 characters")
    val title: String,
    
    @field:NotBlank(message = "Description is required")
    @field:Size(min = 10, max = 300, message = "Description must be between 10 and 300 characters")
    val description: String,
    
    @field:NotBlank(message = "Content is required")
    @field:Size(min = 20, max = 10000, message = "Content must be between 20 and 10000 characters")
    val content: String,
    
    @field:NotBlank(message = "Category is required")
    val category: String,
    
    @field:Size(max = 5, message = "Maximum 5 tags allowed")
    val tags: Set<@Size(min = 2, max = 20, message = "Each tag must be between 2 and 20 characters") String> = emptySet()
)

data class PromptUpdateRequest(
    @field:NotBlank(message = "Title is required")
    @field:Size(min = 5, max = 100, message = "Title must be between 5 and 100 characters")
    val title: String,
    
    @field:NotBlank(message = "Description is required")
    @field:Size(min = 10, max = 300, message = "Description must be between 10 and 300 characters")
    val description: String,
    
    @field:NotBlank(message = "Content is required")
    @field:Size(min = 20, max = 10000, message = "Content must be between 20 and 10000 characters")
    val content: String,
    
    @field:NotBlank(message = "Category is required")
    val category: String,
    
    @field:Size(max = 5, message = "Maximum 5 tags allowed")
    val tags: Set<@Size(min = 2, max = 20, message = "Each tag must be between 2 and 20 characters") String> = emptySet()
)