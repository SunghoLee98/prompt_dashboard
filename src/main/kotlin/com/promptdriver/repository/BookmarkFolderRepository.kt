package com.promptdriver.repository

import com.promptdriver.entity.BookmarkFolder
import com.promptdriver.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface BookmarkFolderRepository : JpaRepository<BookmarkFolder, Long> {

    /**
     * Find all bookmark folders for a specific user
     */
    fun findByUserOrderByCreatedAtDesc(user: User): List<BookmarkFolder>

    /**
     * Find a specific folder by name for a user
     */
    fun findByUserAndName(user: User, name: String): BookmarkFolder?

    /**
     * Check if a folder name exists for a user
     */
    fun existsByUserAndName(user: User, name: String): Boolean

    /**
     * Count total folders for a user
     */
    fun countByUser(user: User): Long

    /**
     * Find folder by ID and user (for permission checking)
     */
    fun findByIdAndUser(id: Long, user: User): BookmarkFolder?

    /**
     * Get folder statistics
     */
    @Query("""
        SELECT bf FROM BookmarkFolder bf
        WHERE bf.user = :user
        ORDER BY bf.bookmarkCount DESC, bf.createdAt DESC
    """)
    fun findByUserOrderByBookmarkCountDesc(@Param("user") user: User): List<BookmarkFolder>
}