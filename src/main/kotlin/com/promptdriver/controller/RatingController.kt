package com.promptdriver.controller

import com.promptdriver.dto.request.CreateRatingRequest
import com.promptdriver.dto.request.UpdateRatingRequest
import com.promptdriver.dto.response.*
import com.promptdriver.service.RatingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@Tag(name = "Rating", description = "Rating management APIs")
@RestController
@RequestMapping("/api/prompts/{promptId}/ratings")
@SecurityRequirement(name = "bearerAuth")
class RatingController(
    private val ratingService: RatingService
) {

    @Operation(summary = "Create a rating for a prompt")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "201", description = "Rating created successfully"),
            ApiResponse(responseCode = "400", description = "Invalid rating value"),
            ApiResponse(responseCode = "401", description = "Unauthorized"),
            ApiResponse(responseCode = "403", description = "Cannot rate your own prompt"),
            ApiResponse(responseCode = "404", description = "Prompt not found"),
            ApiResponse(responseCode = "409", description = "Rating already exists")
        ]
    )
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    fun createRating(
        @PathVariable promptId: Long,
        @Valid @RequestBody request: CreateRatingRequest
    ): ResponseEntity<CreateRatingResponse> {
        val response = ratingService.createRating(promptId, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @Operation(summary = "Update a rating for a prompt")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Rating updated successfully"),
            ApiResponse(responseCode = "400", description = "Invalid rating value"),
            ApiResponse(responseCode = "401", description = "Unauthorized"),
            ApiResponse(responseCode = "403", description = "Can only update your own rating"),
            ApiResponse(responseCode = "404", description = "Rating not found")
        ]
    )
    @PutMapping
    @PreAuthorize("isAuthenticated()")
    fun updateRating(
        @PathVariable promptId: Long,
        @Valid @RequestBody request: UpdateRatingRequest
    ): ResponseEntity<UpdateRatingResponse> {
        val response = ratingService.updateRating(promptId, request)
        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Delete a rating for a prompt")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Rating deleted successfully"),
            ApiResponse(responseCode = "401", description = "Unauthorized"),
            ApiResponse(responseCode = "403", description = "Can only delete your own rating"),
            ApiResponse(responseCode = "404", description = "Rating not found")
        ]
    )
    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    fun deleteRating(
        @PathVariable promptId: Long
    ): ResponseEntity<DeleteRatingResponse> {
        val response = ratingService.deleteRating(promptId)
        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Get current user's rating for a prompt")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Rating retrieved successfully"),
            ApiResponse(responseCode = "204", description = "No rating found"),
            ApiResponse(responseCode = "401", description = "Unauthorized")
        ]
    )
    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    fun getUserRating(
        @PathVariable promptId: Long
    ): ResponseEntity<RatingResponse> {
        val rating = ratingService.getUserRating(promptId)
        return if (rating != null) {
            ResponseEntity.ok(rating)
        } else {
            ResponseEntity.noContent().build()
        }
    }

    @Operation(summary = "Get all ratings for a prompt")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Ratings retrieved successfully")
        ]
    )
    @GetMapping
    fun getPromptRatings(
        @PathVariable promptId: Long,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: Sort.Direction,
        @RequestParam(defaultValue = "false") withComments: Boolean
    ): ResponseEntity<Page<RatingResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy))
        val ratings = if (withComments) {
            ratingService.getPromptRatingsWithComments(promptId, pageable)
        } else {
            ratingService.getPromptRatings(promptId, pageable)
        }
        return ResponseEntity.ok(ratings)
    }

    @Operation(summary = "Get rating statistics for a prompt")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Rating statistics retrieved successfully")
        ]
    )
    @GetMapping("/stats")
    fun getRatingStats(
        @PathVariable promptId: Long
    ): ResponseEntity<RatingStatsResponse> {
        val stats = ratingService.getRatingStats(promptId)
        return ResponseEntity.ok(stats)
    }

    @Operation(summary = "Get recent rating comments for a prompt")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Comments retrieved successfully"),
            ApiResponse(responseCode = "404", description = "Prompt not found")
        ]
    )
    @GetMapping("/comments")
    fun getRecentComments(
        @PathVariable promptId: Long,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<Page<RatingCommentResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val comments = ratingService.getRecentComments(promptId, pageable)
        return ResponseEntity.ok(comments)
    }
}

@RestController
@RequestMapping("/api/users/{userId}/ratings")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User Ratings", description = "User rating management APIs")
class UserRatingController(
    private val ratingService: RatingService
) {

    @Operation(summary = "Get all ratings by a user")
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "Ratings retrieved successfully")
        ]
    )
    @GetMapping
    fun getUserRatings(
        @PathVariable userId: Long,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: Sort.Direction
    ): ResponseEntity<Page<RatingResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy))
        val ratings = ratingService.getUserRatings(userId, pageable)
        return ResponseEntity.ok(ratings)
    }
}