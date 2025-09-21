package com.promptdriver.controller

import com.promptdriver.dto.response.*
import com.promptdriver.exception.UserNotFoundException
import com.promptdriver.repository.UserRepository
import com.promptdriver.service.FollowService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
@Tag(name = "Follow", description = "User follow management operations")
class FollowController(
    private val followService: FollowService,
    private val userRepository: UserRepository
) {

    @Operation(summary = "Follow a user")
    @PostMapping("/{userId}/follow")
    fun followUser(
        @Parameter(description = "User ID to follow") @PathVariable userId: Long,
        authentication: Authentication
    ): ResponseEntity<Void> {
        val followerEmail = authentication.name
        val followerId = getUserIdFromEmail(followerEmail)

        followService.followUser(followerId, userId)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "Unfollow a user")
    @DeleteMapping("/{userId}/follow")
    fun unfollowUser(
        @Parameter(description = "User ID to unfollow") @PathVariable userId: Long,
        authentication: Authentication
    ): ResponseEntity<Void> {
        val followerEmail = authentication.name
        val followerId = getUserIdFromEmail(followerEmail)

        followService.unfollowUser(followerId, userId)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "Get follow status between current user and target user")
    @GetMapping("/{userId}/follow/status")
    fun getFollowStatus(
        @Parameter(description = "Target user ID") @PathVariable userId: Long,
        authentication: Authentication
    ): ResponseEntity<FollowStatusResponse> {
        val requesterEmail = authentication.name
        val requesterId = getUserIdFromEmail(requesterEmail)

        val status = followService.getFollowStatus(requesterId, userId)
        return ResponseEntity.ok(status)
    }

    @Operation(summary = "Get user's followers")
    @GetMapping("/{userId}/followers")
    fun getUserFollowers(
        @Parameter(description = "User ID") @PathVariable userId: Long,
        @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") sort: String,
        @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") direction: String,
        authentication: Authentication?
    ): ResponseEntity<PageResponse<FollowerResponse>> {
        val currentUserId = authentication?.let {
            getUserIdFromEmail(it.name)
        }

        val sortDirection = if (direction.lowercase() == "desc") Sort.Direction.DESC else Sort.Direction.ASC
        val pageable = PageRequest.of(page, minOf(size, 100), Sort.by(sortDirection, sort))

        val followers = followService.getFollowers(userId, currentUserId, pageable)

        val response = PageResponse(
            content = followers.content,
            totalElements = followers.totalElements,
            totalPages = followers.totalPages,
            page = followers.number,
            size = followers.size,
            first = followers.isFirst,
            last = followers.isLast
        )

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Get user's following list")
    @GetMapping("/{userId}/following")
    fun getUserFollowing(
        @Parameter(description = "User ID") @PathVariable userId: Long,
        @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") sort: String,
        @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") direction: String,
        authentication: Authentication?
    ): ResponseEntity<PageResponse<FollowingResponse>> {
        val currentUserId = authentication?.let {
            getUserIdFromEmail(it.name)
        }

        val sortDirection = if (direction.lowercase() == "desc") Sort.Direction.DESC else Sort.Direction.ASC
        val pageable = PageRequest.of(page, minOf(size, 100), Sort.by(sortDirection, sort))

        val following = followService.getFollowing(userId, currentUserId, pageable)

        val response = PageResponse(
            content = following.content,
            totalElements = following.totalElements,
            totalPages = following.totalPages,
            page = following.number,
            size = following.size,
            first = following.isFirst,
            last = following.isLast
        )

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Get feed from followed users")
    @GetMapping("/me/feed")
    fun getUserFeed(
        @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") sort: String,
        @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") direction: String,
        authentication: Authentication
    ): ResponseEntity<PageResponse<PromptSummaryResponse>> {
        val userEmail = authentication.name
        val userId = getUserIdFromEmail(userEmail)

        val sortDirection = if (direction.lowercase() == "desc") Sort.Direction.DESC else Sort.Direction.ASC
        val pageable = PageRequest.of(page, minOf(size, 100), Sort.by(sortDirection, sort))

        val feed = followService.getUserFeed(userId, pageable)

        val response = PageResponse(
            content = feed.content,
            totalElements = feed.totalElements,
            totalPages = feed.totalPages,
            page = feed.number,
            size = feed.size,
            first = feed.isFirst,
            last = feed.isLast
        )

        return ResponseEntity.ok(response)
    }

    // Helper method to get user ID from email
    private fun getUserIdFromEmail(email: String): Long {
        val user = userRepository.findByEmail(email)
            ?: throw UserNotFoundException("User not found with email: $email")
        return user.id
    }
}