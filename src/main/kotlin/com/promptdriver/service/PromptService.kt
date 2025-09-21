package com.promptdriver.service

import com.promptdriver.dto.request.PromptCreateRequest
import com.promptdriver.dto.request.PromptUpdateRequest
import com.promptdriver.dto.response.*
import com.promptdriver.entity.Prompt
import com.promptdriver.entity.PromptLike
import com.promptdriver.exception.*
import com.promptdriver.repository.PromptLikeRepository
import com.promptdriver.repository.PromptRatingRepository
import com.promptdriver.repository.PromptRepository
import com.promptdriver.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class PromptService(
    private val promptRepository: PromptRepository,
    private val userRepository: UserRepository,
    private val promptLikeRepository: PromptLikeRepository,
    private val promptRatingRepository: PromptRatingRepository,
    private val validCategories: List<String> = listOf("coding", "writing", "analysis", "design", "marketing", "education", "productivity", "other")
) {
    private val logger = LoggerFactory.getLogger(PromptService::class.java)
    
    @Transactional(readOnly = true)
    fun getAllPrompts(
        search: String?,
        category: String?,
        pageable: Pageable
    ): PageResponse<PromptListResponse> {
        logger.debug("Getting all prompts with search: $search, category: $category")
        
        val page: Page<Prompt> = when {
            !search.isNullOrBlank() && !category.isNullOrBlank() -> {
                validateCategory(category)
                promptRepository.searchByCategoryAndIsPublicTrue(search, category, pageable)
            }
            !search.isNullOrBlank() -> {
                promptRepository.searchPublicPrompts(search, pageable)
            }
            !category.isNullOrBlank() -> {
                validateCategory(category)
                promptRepository.findByCategoryAndIsPublicTrue(category, pageable)
            }
            else -> {
                promptRepository.findByIsPublicTrue(pageable)
            }
        }
        
        return PageResponse(
            content = page.content.map { prompt -> toPromptListResponse(prompt) },
            totalElements = page.totalElements,
            totalPages = page.totalPages,
            page = page.number,
            size = page.size,
            first = page.isFirst,
            last = page.isLast
        )
    }
    
    @Transactional
    fun getPromptById(id: Long): PromptResponse {
        logger.debug("Getting prompt by id: $id")
        
        val prompt = promptRepository.findById(id).orElseThrow {
            PromptNotFoundException("Prompt not found with id: $id")
        }
        
        if (!prompt.isPublic) {
            // Check if current user is the author
            val currentUser = getCurrentUser()
            if (currentUser == null || currentUser.id != prompt.author.id) {
                throw ForbiddenException("This prompt is private")
            }
        }
        
        // Increment view count
        promptRepository.incrementViewCount(id)
        
        // Check if current user has liked this prompt
        val isLiked = getCurrentUser()?.let { user ->
            promptLikeRepository.existsByUserAndPrompt(user, prompt)
        } ?: false
        
        return toPromptResponse(prompt, isLiked)
    }
    
    fun createPrompt(request: PromptCreateRequest): PromptResponse {
        logger.debug("Creating new prompt")
        
        validateCategory(request.category)
        
        val currentUser = getCurrentUser()
            ?: throw UnauthorizedAccessException("User not authenticated")
        
        val prompt = Prompt(
            title = request.title,
            description = request.description,
            content = request.content,
            category = request.category,
            tags = request.tags,
            author = currentUser
        )
        
        val savedPrompt = promptRepository.save(prompt)
        logger.info("Prompt created successfully with id: ${savedPrompt.id}")
        
        return toPromptResponse(savedPrompt, false)
    }
    
    fun updatePrompt(id: Long, request: PromptUpdateRequest): PromptResponse {
        logger.debug("Updating prompt with id: $id")
        
        validateCategory(request.category)
        
        val prompt = promptRepository.findById(id).orElseThrow {
            PromptNotFoundException("Prompt not found with id: $id")
        }
        
        val currentUser = getCurrentUser()
            ?: throw UnauthorizedAccessException("User not authenticated")
        
        if (prompt.author.id != currentUser.id) {
            throw ForbiddenException("You can only edit your own prompts")
        }
        
        prompt.apply {
            title = request.title
            description = request.description
            content = request.content
            category = request.category
            tags = request.tags
        }
        
        val updatedPrompt = promptRepository.save(prompt)
        logger.info("Prompt updated successfully with id: ${updatedPrompt.id}")
        
        val isLiked = promptLikeRepository.existsByUserAndPrompt(currentUser, updatedPrompt)
        
        return toPromptResponse(updatedPrompt, isLiked)
    }
    
    fun deletePrompt(id: Long) {
        logger.debug("Deleting prompt with id: $id")
        
        val prompt = promptRepository.findById(id).orElseThrow {
            PromptNotFoundException("Prompt not found with id: $id")
        }
        
        val currentUser = getCurrentUser()
            ?: throw UnauthorizedAccessException("User not authenticated")
        
        if (prompt.author.id != currentUser.id) {
            throw ForbiddenException("You can only delete your own prompts")
        }
        
        promptRepository.delete(prompt)
        logger.info("Prompt deleted successfully with id: $id")
    }
    
    fun toggleLike(promptId: Long): LikeResponse {
        logger.debug("Toggling like for prompt: $promptId")
        
        val prompt = promptRepository.findById(promptId).orElseThrow {
            PromptNotFoundException("Prompt not found with id: $promptId")
        }
        
        val currentUser = getCurrentUser()
            ?: throw UnauthorizedAccessException("User not authenticated")
        
        val existingLike = promptLikeRepository.findByUserAndPrompt(currentUser, prompt)
        
        return if (existingLike != null) {
            // Unlike
            promptLikeRepository.delete(existingLike)
            promptRepository.decrementLikeCount(promptId)
            
            logger.info("User ${currentUser.email} unliked prompt $promptId")
            
            LikeResponse(
                liked = false,
                likeCount = prompt.likeCount - 1
            )
        } else {
            // Like
            val like = PromptLike(
                user = currentUser,
                prompt = prompt
            )
            promptLikeRepository.save(like)
            promptRepository.incrementLikeCount(promptId)
            
            logger.info("User ${currentUser.email} liked prompt $promptId")
            
            LikeResponse(
                liked = true,
                likeCount = prompt.likeCount + 1
            )
        }
    }
    
    fun getCategories(): List<CategoryResponse> {
        return validCategories.map { category ->
            CategoryResponse(
                id = category,
                name = category.replaceFirstChar { it.uppercase() },
                description = getCategoryDescription(category)
            )
        }
    }
    
    private fun getCurrentUser() = SecurityContextHolder.getContext().authentication?.let { auth ->
        userRepository.findByEmail(auth.name)
    }
    
    private fun validateCategory(category: String) {
        if (!validCategories.contains(category)) {
            throw InvalidCategoryException("Invalid category: $category. Valid categories are: ${validCategories.joinToString()}")
        }
    }
    
    private fun toPromptResponse(prompt: Prompt, isLiked: Boolean): PromptResponse {
        // Get current user's rating if authenticated
        val userRating = getCurrentUser()?.let { user ->
            promptRatingRepository.findUserRatingForPrompt(prompt.id, user.id)
        }
        
        return PromptResponse(
            id = prompt.id,
            title = prompt.title,
            description = prompt.description,
            content = prompt.content,
            category = prompt.category,
            tags = prompt.tags,
            author = AuthorResponse(
                id = prompt.author.id,
                nickname = prompt.author.nickname
            ),
            likeCount = prompt.likeCount,
            viewCount = prompt.viewCount,
            bookmarkCount = prompt.bookmarkCount,
            isLiked = isLiked,
            averageRating = prompt.averageRating ?: 0.0,
            ratingCount = prompt.ratingCount,
            userRating = userRating,
            createdAt = prompt.createdAt,
            updatedAt = prompt.updatedAt
        )
    }
    
    private fun toPromptListResponse(prompt: Prompt): PromptListResponse {
        return PromptListResponse(
            id = prompt.id,
            title = prompt.title,
            description = prompt.description,
            content = prompt.content,
            category = prompt.category,
            tags = prompt.tags,
            author = AuthorResponse(
                id = prompt.author.id,
                nickname = prompt.author.nickname
            ),
            likeCount = prompt.likeCount,
            viewCount = prompt.viewCount,
            bookmarkCount = prompt.bookmarkCount,
            averageRating = prompt.averageRating ?: 0.0,
            ratingCount = prompt.ratingCount,
            createdAt = prompt.createdAt,
            updatedAt = prompt.updatedAt
        )
    }
    
    private fun getCategoryDescription(category: String): String {
        return when (category) {
            "coding" -> "Programming and code snippets"
            "writing" -> "Creative writing and content"
            "analysis" -> "Data analysis and research"
            "design" -> "Design and UI/UX"
            "marketing" -> "Marketing and sales"
            "education" -> "Teaching and learning"
            "productivity" -> "Productivity and automation"
            "other" -> "Miscellaneous"
            else -> "Other prompts"
        }
    }
}