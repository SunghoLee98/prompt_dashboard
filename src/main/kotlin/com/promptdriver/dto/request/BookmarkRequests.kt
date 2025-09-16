package com.promptdriver.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * Request DTO for creating a bookmark folder
 */
data class CreateBookmarkFolderRequest(
    @field:NotBlank(message = "Folder name cannot be blank")
    @field:Size(min = 3, max = 50, message = "Folder name must be between 3 and 50 characters")
    val name: String,

    @field:Size(max = 200, message = "Description cannot exceed 200 characters")
    val description: String? = null
)

/**
 * Request DTO for updating a bookmark folder
 */
data class UpdateBookmarkFolderRequest(
    @field:NotBlank(message = "Folder name cannot be blank")
    @field:Size(min = 3, max = 50, message = "Folder name must be between 3 and 50 characters")
    val name: String,

    @field:Size(max = 200, message = "Description cannot exceed 200 characters")
    val description: String? = null
)

/**
 * Request DTO for moving a bookmark to a folder
 */
data class MoveBookmarkRequest(
    val folderId: Long?
)