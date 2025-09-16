package com.promptdriver.controller

import com.promptdriver.dto.request.PromptCreateRequest
import com.promptdriver.dto.request.PromptUpdateRequest
import com.promptdriver.dto.response.*
import com.promptdriver.service.PromptService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/prompts")
@Tag(name = "Prompts", description = "Prompt management APIs")
class PromptController(
    private val promptService: PromptService
) {
    
    @GetMapping
    @Operation(summary = "Get all prompts (paginated)")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Prompts retrieved successfully")
    )
    fun getAllPrompts(
        @Parameter(description = "Page number (0-indexed)")
        @RequestParam(defaultValue = "0") page: Int,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") size: Int,
        
        @Parameter(description = "Sort field and direction (e.g., 'createdAt,desc')")
        @RequestParam(defaultValue = "createdAt,desc") sort: String,
        
        @Parameter(description = "Search query for title, description, or content")
        @RequestParam(required = false) search: String?,
        
        @Parameter(description = "Filter by category")
        @RequestParam(required = false) category: String?
    ): ResponseEntity<PageResponse<PromptListResponse>> {
        val sortParams = sort.split(",")
        val sortField = sortParams.getOrNull(0) ?: "createdAt"
        val sortDirection = if (sortParams.getOrNull(1) == "asc") Sort.Direction.ASC else Sort.Direction.DESC
        
        val pageable = PageRequest.of(
            page,
            minOf(size, 100), // Max size is 100
            Sort.by(sortDirection, sortField)
        )
        
        val response = promptService.getAllPrompts(search, category, pageable)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get single prompt by ID")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Prompt retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Prompt not found")
    )
    fun getPromptById(
        @PathVariable id: Long
    ): ResponseEntity<PromptResponse> {
        val response = promptService.getPromptById(id)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping
    @Operation(summary = "Create a new prompt", security = [SecurityRequirement(name = "bearer-jwt")])
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Prompt created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid input data"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun createPrompt(
        @Valid @RequestBody request: PromptCreateRequest
    ): ResponseEntity<PromptResponse> {
        val response = promptService.createPrompt(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update a prompt", security = [SecurityRequirement(name = "bearer-jwt")])
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Prompt updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid input data"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden - not the author"),
        ApiResponse(responseCode = "404", description = "Prompt not found")
    )
    fun updatePrompt(
        @PathVariable id: Long,
        @Valid @RequestBody request: PromptUpdateRequest
    ): ResponseEntity<PromptResponse> {
        val response = promptService.updatePrompt(id, request)
        return ResponseEntity.ok(response)
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a prompt", security = [SecurityRequirement(name = "bearer-jwt")])
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Prompt deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "403", description = "Forbidden - not the author"),
        ApiResponse(responseCode = "404", description = "Prompt not found")
    )
    fun deletePrompt(
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        promptService.deletePrompt(id)
        return ResponseEntity.noContent().build()
    }
    
    @PostMapping("/{id}/like")
    @Operation(summary = "Like/unlike a prompt", security = [SecurityRequirement(name = "bearer-jwt")])
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Like status toggled successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized"),
        ApiResponse(responseCode = "404", description = "Prompt not found")
    )
    fun toggleLike(
        @PathVariable id: Long
    ): ResponseEntity<LikeResponse> {
        val response = promptService.toggleLike(id)
        return ResponseEntity.ok(response)
    }
}

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categories", description = "Category management APIs")
class CategoryController(
    private val promptService: PromptService
) {
    
    @GetMapping
    @Operation(summary = "Get all categories")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Categories retrieved successfully")
    )
    fun getCategories(): ResponseEntity<List<CategoryResponse>> {
        val response = promptService.getCategories()
        return ResponseEntity.ok(response)
    }
}