package com.promptdriver.service

import com.promptdriver.dto.request.CreateRatingRequest
import com.promptdriver.dto.request.UpdateRatingRequest
import com.promptdriver.dto.response.*
import com.promptdriver.entity.PromptRating
import com.promptdriver.exception.*
import com.promptdriver.repository.PromptRatingRepository
import com.promptdriver.repository.PromptRepository
import com.promptdriver.repository.UserRepository
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class RatingService(
    private val promptRatingRepository: PromptRatingRepository,
    private val promptRepository: PromptRepository,
    private val userRepository: UserRepository,
    private val htmlSafeList: Safelist
) {
    private val logger = LoggerFactory.getLogger(RatingService::class.java)
    
    private fun getCurrentUser() = SecurityContextHolder.getContext().authentication?.let { auth ->
        userRepository.findByEmail(auth.name)
    }
    
    private fun getCurrentUserId(): Long {
        val user = getCurrentUser() ?: throw UnauthorizedAccessException("User not authenticated")
        return user.id
    }

    fun createRating(promptId: Long, request: CreateRatingRequest): CreateRatingResponse {
        val userId = getCurrentUserId()
        return createRating(promptId, userId, request)
    }
    
    fun createRating(promptId: Long, userId: Long, request: CreateRatingRequest): CreateRatingResponse {
        logger.info("Creating rating for prompt $promptId by user $userId with rating ${request.rating}")
        
        val prompt = promptRepository.findById(promptId)
            .orElseThrow { PromptNotFoundException("Prompt with id $promptId not found") }
        
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException("User with id $userId not found") }
        
        // Check if user is trying to rate their own prompt
        if (prompt.author.id == userId) {
            throw SelfRatingException("You cannot rate your own prompt")
        }
        
        // Check if rating already exists
        if (promptRatingRepository.existsByPromptIdAndUserId(promptId, userId)) {
            throw RatingAlreadyExistsException("You have already rated this prompt")
        }
        
        // Sanitize comment to prevent XSS
        val sanitizedComment = request.comment?.let { sanitizeHtmlContent(it) }

        // Create and save rating
        val rating = PromptRating(
            prompt = prompt,
            user = user,
            rating = request.rating,
            comment = sanitizedComment
        )
        
        val savedRating = promptRatingRepository.save(rating)
        
        // Update prompt statistics (handled by database trigger, but we can also do it here for immediate consistency)
        val averageRating = promptRatingRepository.findAverageRatingByPromptId(promptId) ?: 0.0
        val ratingCount = promptRatingRepository.countByPromptId(promptId).toInt()
        
        prompt.averageRating = averageRating
        prompt.ratingCount = ratingCount
        promptRepository.save(prompt)
        
        logger.info("Rating created successfully with id ${savedRating.id}")
        
        return CreateRatingResponse(
            id = savedRating.id,
            rating = savedRating.rating,
            averageRating = averageRating,
            ratingCount = ratingCount
        )
    }

    fun updateRating(promptId: Long, request: UpdateRatingRequest): UpdateRatingResponse {
        val userId = getCurrentUserId()
        return updateRating(promptId, userId, request)
    }
    
    fun updateRating(promptId: Long, userId: Long, request: UpdateRatingRequest): UpdateRatingResponse {
        logger.info("Updating rating for prompt $promptId by user $userId to ${request.rating}")
        
        val rating = promptRatingRepository.findByPromptIdAndUserId(promptId, userId)
            .orElseThrow { RatingNotFoundException("Rating not found for this prompt") }
        
        // Check if user owns the rating
        if (rating.user.id != userId) {
            throw UnauthorizedRatingAccessException("You can only update your own ratings")
        }
        
        // Sanitize comment to prevent XSS
        val sanitizedComment = request.comment?.let { sanitizeHtmlContent(it) }

        // Update rating
        rating.updateRating(request.rating, sanitizedComment)
        val updatedRating = promptRatingRepository.save(rating)
        
        // Update prompt statistics
        val averageRating = promptRatingRepository.findAverageRatingByPromptId(promptId) ?: 0.0
        val ratingCount = promptRatingRepository.countByPromptId(promptId).toInt()
        
        val prompt = rating.prompt
        prompt.averageRating = averageRating
        prompt.ratingCount = ratingCount
        promptRepository.save(prompt)
        
        logger.info("Rating updated successfully")
        
        return UpdateRatingResponse(
            id = updatedRating.id,
            rating = updatedRating.rating,
            averageRating = averageRating,
            ratingCount = ratingCount
        )
    }

    fun deleteRating(promptId: Long): DeleteRatingResponse {
        val userId = getCurrentUserId()
        return deleteRating(promptId, userId)
    }
    
    fun deleteRating(promptId: Long, userId: Long): DeleteRatingResponse {
        logger.info("Deleting rating for prompt $promptId by user $userId")
        
        val rating = promptRatingRepository.findByPromptIdAndUserId(promptId, userId)
            .orElseThrow { RatingNotFoundException("Rating not found for this prompt") }
        
        // Check if user owns the rating
        if (rating.user.id != userId) {
            throw UnauthorizedRatingAccessException("You can only delete your own ratings")
        }
        
        // Delete rating
        promptRatingRepository.delete(rating)
        
        // Update prompt statistics
        val averageRating = promptRatingRepository.findAverageRatingByPromptId(promptId) ?: 0.0
        val ratingCount = promptRatingRepository.countByPromptId(promptId).toInt()
        
        val prompt = promptRepository.findById(promptId).orElseThrow()
        prompt.averageRating = averageRating
        prompt.ratingCount = ratingCount
        promptRepository.save(prompt)
        
        logger.info("Rating deleted successfully")
        
        return DeleteRatingResponse(
            averageRating = averageRating,
            ratingCount = ratingCount
        )
    }

    @Transactional(readOnly = true)
    fun getUserRating(promptId: Long): RatingResponse? {
        val userId = getCurrentUserId()
        return getRating(promptId, userId)
    }
    
    // Keep backward compatibility
    @Deprecated("Use getUserRating instead", ReplaceWith("getUserRating(promptId)"))
    fun getMyRating(promptId: Long): RatingResponse? = getUserRating(promptId)
    
    @Transactional(readOnly = true)
    fun getRating(promptId: Long, userId: Long): RatingResponse? {
        logger.info("Getting rating for prompt $promptId by user $userId")
        
        return promptRatingRepository.findByPromptIdAndUserId(promptId, userId)
            .map { rating ->
                RatingResponse(
                    id = rating.id,
                    promptId = rating.prompt.id,
                    userId = rating.user.id,
                    userNickname = rating.user.nickname,
                    rating = rating.rating,
                    comment = rating.comment,
                    createdAt = rating.createdAt,
                    updatedAt = rating.updatedAt
                )
            }
            .orElse(null)
    }

    @Transactional(readOnly = true)
    fun getPromptRatings(promptId: Long, pageable: Pageable): Page<RatingResponse> {
        logger.info("Getting all ratings for prompt $promptId")
        
        return promptRatingRepository.findAllByPromptId(promptId, pageable)
            .map { rating ->
                RatingResponse(
                    id = rating.id,
                    promptId = rating.prompt.id,
                    userId = rating.user.id,
                    userNickname = rating.user.nickname,
                    rating = rating.rating,
                    comment = rating.comment,
                    createdAt = rating.createdAt,
                    updatedAt = rating.updatedAt
                )
            }
    }

    @Transactional(readOnly = true)
    fun getUserRatings(userId: Long, pageable: Pageable): Page<RatingResponse> {
        logger.info("Getting all ratings by user $userId")
        
        return promptRatingRepository.findAllByUserId(userId, pageable)
            .map { rating ->
                RatingResponse(
                    id = rating.id,
                    promptId = rating.prompt.id,
                    userId = rating.user.id,
                    userNickname = rating.user.nickname,
                    rating = rating.rating,
                    comment = rating.comment,
                    createdAt = rating.createdAt,
                    updatedAt = rating.updatedAt
                )
            }
    }

    @Transactional(readOnly = true)
    fun getRatingStats(promptId: Long): RatingStatsResponse {
        val userId = try {
            getCurrentUserId()
        } catch (e: Exception) {
            null
        }
        return getRatingStats(promptId, userId)
    }
    
    @Transactional(readOnly = true)
    fun getRatingStats(promptId: Long, userId: Long? = null): RatingStatsResponse {
        logger.info("Getting rating statistics for prompt $promptId")
        
        val averageRating = promptRatingRepository.findAverageRatingByPromptId(promptId) ?: 0.0
        val ratingCount = promptRatingRepository.countByPromptId(promptId).toInt()
        val userRating = userId?.let { 
            promptRatingRepository.findUserRatingForPrompt(promptId, it)
        }
        
        // Get rating distribution
        val allRatings = promptRatingRepository.findAllByPromptId(promptId, Pageable.unpaged())
        val distribution = allRatings.content
            .groupBy { it.rating }
            .mapValues { it.value.size }
            .let { dist ->
                (1..5).associateWith { rating -> dist[rating] ?: 0 }
            }
        
        return RatingStatsResponse(
            averageRating = averageRating,
            ratingCount = ratingCount,
            userRating = userRating,
            distribution = distribution
        )
    }

    @Transactional(readOnly = true)
    fun getRecentComments(promptId: Long, pageable: Pageable): Page<RatingCommentResponse> {
        logger.info("Getting recent comments for prompt $promptId")

        return promptRatingRepository.findAllByPromptIdAndCommentIsNotNull(promptId, pageable)
            .map { rating ->
                RatingCommentResponse(
                    id = rating.id,
                    userId = rating.user.id,
                    userNickname = rating.user.nickname,
                    rating = rating.rating,
                    comment = rating.comment!!,
                    createdAt = rating.createdAt
                )
            }
    }

    @Transactional(readOnly = true)
    fun getPromptRatingsWithComments(promptId: Long, pageable: Pageable): Page<RatingResponse> {
        logger.info("Getting ratings with comments for prompt $promptId")

        return promptRatingRepository.findAllByPromptIdAndCommentIsNotNull(promptId, pageable)
            .map { rating ->
                RatingResponse(
                    id = rating.id,
                    promptId = rating.prompt.id,
                    userId = rating.user.id,
                    userNickname = rating.user.nickname,
                    rating = rating.rating,
                    comment = rating.comment,
                    createdAt = rating.createdAt,
                    updatedAt = rating.updatedAt
                )
            }
    }

    private fun sanitizeHtmlContent(content: String): String {
        // Clean the HTML content using the configured safe list
        val cleaned = Jsoup.clean(content, htmlSafeList)

        // Additional validation: check if result is not empty after cleaning
        // If the content was completely removed by sanitization, return the original trimmed content
        return cleaned.trim().takeIf { it.isNotEmpty() } ?: content.trim()
    }
}