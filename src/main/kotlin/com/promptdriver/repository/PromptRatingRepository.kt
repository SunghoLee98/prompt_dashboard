package com.promptdriver.repository

import com.promptdriver.entity.Prompt
import com.promptdriver.entity.PromptRating
import com.promptdriver.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface PromptRatingRepository : JpaRepository<PromptRating, Long> {
    
    fun findByPromptIdAndUserId(promptId: Long, userId: Long): Optional<PromptRating>
    
    fun findByPromptAndUser(prompt: Prompt, user: User): Optional<PromptRating>
    
    fun existsByPromptIdAndUserId(promptId: Long, userId: Long): Boolean
    
    fun findAllByPromptId(promptId: Long, pageable: Pageable): Page<PromptRating>
    
    fun findAllByUserId(userId: Long, pageable: Pageable): Page<PromptRating>
    
    @Query("SELECT AVG(r.rating) FROM PromptRating r WHERE r.prompt.id = :promptId")
    fun findAverageRatingByPromptId(@Param("promptId") promptId: Long): Double?
    
    @Query("SELECT COUNT(r) FROM PromptRating r WHERE r.prompt.id = :promptId")
    fun countByPromptId(@Param("promptId") promptId: Long): Long
    
    @Query("SELECT r.rating FROM PromptRating r WHERE r.prompt.id = :promptId AND r.user.id = :userId")
    fun findUserRatingForPrompt(@Param("promptId") promptId: Long, @Param("userId") userId: Long): Int?
    
    fun deleteByPromptIdAndUserId(promptId: Long, userId: Long)

    fun findAllByPromptIdAndCommentIsNotNull(promptId: Long, pageable: Pageable): Page<PromptRating>

    @Query("SELECT r FROM PromptRating r WHERE r.prompt.id = :promptId AND r.comment IS NOT NULL ORDER BY r.createdAt DESC")
    fun findRecentCommentsForPrompt(@Param("promptId") promptId: Long, pageable: Pageable): Page<PromptRating>

    @Query("SELECT COUNT(r) FROM PromptRating r WHERE r.prompt.id = :promptId AND r.comment IS NOT NULL")
    fun countCommentsForPrompt(@Param("promptId") promptId: Long): Long
}