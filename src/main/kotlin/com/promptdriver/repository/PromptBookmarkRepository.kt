package com.promptdriver.repository

import com.promptdriver.entity.BookmarkFolder
import com.promptdriver.entity.Prompt
import com.promptdriver.entity.PromptBookmark
import com.promptdriver.entity.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface PromptBookmarkRepository : JpaRepository<PromptBookmark, Long> {

    /**
     * Find bookmark by user and prompt
     */
    fun findByUserAndPrompt(user: User, prompt: Prompt): PromptBookmark?

    /**
     * Check if user has bookmarked a prompt
     */
    fun existsByUserAndPrompt(user: User, prompt: Prompt): Boolean

    /**
     * Get user's bookmarks with pagination
     */
    fun findByUserOrderByCreatedAtDesc(user: User, pageable: Pageable): Page<PromptBookmark>

    /**
     * Get user's bookmarks in a specific folder
     */
    fun findByUserAndFolderOrderByCreatedAtDesc(user: User, folder: BookmarkFolder?, pageable: Pageable): Page<PromptBookmark>

    /**
     * Search user's bookmarks by prompt title or content
     */
    @Query("""
        SELECT pb FROM PromptBookmark pb
        JOIN pb.prompt p
        WHERE pb.user = :user
        AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY pb.createdAt DESC
    """)
    fun findByUserAndPromptContentContaining(
        @Param("user") user: User,
        @Param("search") search: String,
        pageable: Pageable
    ): Page<PromptBookmark>

    /**
     * Search user's bookmarks by prompt title or content within a folder
     */
    @Query("""
        SELECT pb FROM PromptBookmark pb
        JOIN pb.prompt p
        WHERE pb.user = :user
        AND pb.folder = :folder
        AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(p.content) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY pb.createdAt DESC
    """)
    fun findByUserAndFolderAndPromptContentContaining(
        @Param("user") user: User,
        @Param("folder") folder: BookmarkFolder?,
        @Param("search") search: String,
        pageable: Pageable
    ): Page<PromptBookmark>

    /**
     * Count bookmarks in a folder
     */
    fun countByFolder(folder: BookmarkFolder): Long

    /**
     * Count total bookmarks for a user
     */
    fun countByUser(user: User): Long

    /**
     * Find all bookmarks in a folder (for moving when folder is deleted)
     */
    fun findByFolder(folder: BookmarkFolder): List<PromptBookmark>

    /**
     * Get most bookmarked prompts
     */
    @Query("""
        SELECT p FROM Prompt p
        WHERE p.bookmarkCount > 0
        ORDER BY p.bookmarkCount DESC, p.createdAt DESC
    """)
    fun findMostBookmarkedPrompts(pageable: Pageable): Page<Prompt>

    /**
     * Get most bookmarked prompts within timeframe
     */
    @Query("""
        SELECT p FROM Prompt p
        WHERE p.bookmarkCount > 0
        AND EXISTS (
            SELECT pb FROM PromptBookmark pb
            WHERE pb.prompt = p
            AND pb.createdAt >= :since
        )
        ORDER BY p.bookmarkCount DESC, p.createdAt DESC
    """)
    fun findMostBookmarkedPromptsSince(
        @Param("since") since: java.time.LocalDateTime,
        pageable: Pageable
    ): Page<Prompt>

    /**
     * Find bookmark by ID and user (for permission checking)
     */
    fun findByIdAndUser(id: Long, user: User): PromptBookmark?
}