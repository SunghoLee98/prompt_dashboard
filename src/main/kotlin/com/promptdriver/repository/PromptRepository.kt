package com.promptdriver.repository

import com.promptdriver.entity.Prompt
import com.promptdriver.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface PromptRepository : JpaRepository<Prompt, Long> {
    
    fun findByIdAndIsPublicTrue(id: Long): Optional<Prompt>
    
    fun findByAuthor(author: User, pageable: Pageable): Page<Prompt>
    
    fun findByIsPublicTrue(pageable: Pageable): Page<Prompt>
    
    @Query("""
        SELECT p FROM Prompt p 
        WHERE p.isPublic = true 
        AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) 
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) 
             OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    fun searchPublicPrompts(@Param("search") search: String, pageable: Pageable): Page<Prompt>
    
    @Query("""
        SELECT p FROM Prompt p 
        WHERE p.isPublic = true 
        AND p.category = :category
    """)
    fun findByCategoryAndIsPublicTrue(@Param("category") category: String, pageable: Pageable): Page<Prompt>
    
    @Query("""
        SELECT p FROM Prompt p 
        WHERE p.isPublic = true 
        AND p.category = :category
        AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) 
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) 
             OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    fun searchByCategoryAndIsPublicTrue(
        @Param("search") search: String,
        @Param("category") category: String,
        pageable: Pageable
    ): Page<Prompt>
    
    @Modifying
    @Query("UPDATE Prompt p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    fun incrementViewCount(@Param("id") promptId: Long)
    
    @Modifying
    @Query("UPDATE Prompt p SET p.likeCount = p.likeCount + 1 WHERE p.id = :id")
    fun incrementLikeCount(@Param("id") promptId: Long)
    
    @Modifying
    @Query("UPDATE Prompt p SET p.likeCount = p.likeCount - 1 WHERE p.id = :id AND p.likeCount > 0")
    fun decrementLikeCount(@Param("id") promptId: Long)

    fun countByAuthorAndIsPublic(author: User, isPublic: Boolean): Long

    fun findByAuthorIdInAndIsPublicOrderByCreatedAtDesc(
        authorIds: List<Long>,
        isPublic: Boolean,
        pageable: Pageable
    ): Page<Prompt>
}