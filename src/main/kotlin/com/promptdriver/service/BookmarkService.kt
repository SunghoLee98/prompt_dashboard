package com.promptdriver.service

import com.promptdriver.dto.request.CreateBookmarkFolderRequest
import com.promptdriver.dto.request.MoveBookmarkRequest
import com.promptdriver.dto.request.UpdateBookmarkFolderRequest
import com.promptdriver.dto.response.*
import com.promptdriver.entity.*
import com.promptdriver.exception.*
import com.promptdriver.repository.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class BookmarkService(
    private val promptBookmarkRepository: PromptBookmarkRepository,
    private val bookmarkFolderRepository: BookmarkFolderRepository,
    private val promptRepository: PromptRepository,
    private val userRepository: UserRepository
) {

    companion object {
        private const val MAX_FOLDERS_PER_USER = 20
    }

    /**
     * Toggle bookmark for a prompt (bookmark/unbookmark)
     */
    fun toggleBookmark(promptId: Long, userEmail: String): BookmarkToggleResponse {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        val prompt = promptRepository.findById(promptId)
            .orElseThrow { PromptNotFoundException() }

        // Prevent self-bookmarking
        if (prompt.author.email == userEmail) {
            throw SelfBookmarkNotAllowedException()
        }

        val existingBookmark = promptBookmarkRepository.findByUserAndPrompt(user, prompt)

        return if (existingBookmark != null) {
            // Remove bookmark
            promptBookmarkRepository.delete(existingBookmark)
            prompt.decrementBookmarkCount()
            promptRepository.save(prompt)
            BookmarkToggleResponse(bookmarked = false, bookmarkCount = prompt.bookmarkCount)
        } else {
            // Add bookmark
            val bookmark = PromptBookmark(
                user = user,
                prompt = prompt,
                folder = null
            )
            promptBookmarkRepository.save(bookmark)
            prompt.incrementBookmarkCount()
            promptRepository.save(prompt)
            BookmarkToggleResponse(bookmarked = true, bookmarkCount = prompt.bookmarkCount)
        }
    }

    /**
     * Get user's bookmarks with pagination and optional filtering
     */
    @Transactional(readOnly = true)
    fun getUserBookmarks(
        userEmail: String,
        folderId: Long?,
        search: String?,
        pageable: Pageable
    ): Page<BookmarkResponse> {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        val folder = folderId?.let { id ->
            bookmarkFolderRepository.findByIdAndUser(id, user)
                ?: throw BookmarkFolderNotFoundException()
        }

        val bookmarks = when {
            search != null && folder != null -> {
                promptBookmarkRepository.findByUserAndFolderAndPromptContentContaining(user, folder, search, pageable)
            }
            search != null -> {
                promptBookmarkRepository.findByUserAndPromptContentContaining(user, search, pageable)
            }
            folder != null -> {
                promptBookmarkRepository.findByUserAndFolderOrderByCreatedAtDesc(user, folder, pageable)
            }
            else -> {
                promptBookmarkRepository.findByUserOrderByCreatedAtDesc(user, pageable)
            }
        }

        return bookmarks.map { bookmark ->
            BookmarkResponse(
                id = bookmark.id,
                prompt = BookmarkedPromptInfo(
                    id = bookmark.prompt.id,
                    title = bookmark.prompt.title,
                    description = bookmark.prompt.description,
                    category = bookmark.prompt.category,
                    tags = bookmark.prompt.tags,
                    author = AuthorResponse(
                        id = bookmark.prompt.author.id,
                        nickname = bookmark.prompt.author.nickname
                    ),
                    likeCount = bookmark.prompt.likeCount,
                    viewCount = bookmark.prompt.viewCount,
                    averageRating = bookmark.prompt.averageRating ?: 0.0,
                    ratingCount = bookmark.prompt.ratingCount,
                    createdAt = bookmark.prompt.createdAt
                ),
                folder = bookmark.folder?.let { f ->
                    BookmarkFolderInfo(
                        id = f.id,
                        name = f.name
                    )
                },
                createdAt = bookmark.createdAt
            )
        }
    }

    /**
     * Create a new bookmark folder
     */
    fun createBookmarkFolder(userEmail: String, request: CreateBookmarkFolderRequest): BookmarkFolderResponse {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        // Check folder limit
        val folderCount = bookmarkFolderRepository.countByUser(user)
        if (folderCount >= MAX_FOLDERS_PER_USER) {
            throw BookmarkFolderLimitExceededException()
        }

        // Check for duplicate name
        if (bookmarkFolderRepository.existsByUserAndName(user, request.name)) {
            throw FolderNameAlreadyExistsException()
        }

        val folder = BookmarkFolder(
            user = user,
            name = request.name,
            description = request.description
        )

        val savedFolder = bookmarkFolderRepository.save(folder)

        return BookmarkFolderResponse(
            id = savedFolder.id,
            name = savedFolder.name,
            description = savedFolder.description,
            bookmarkCount = savedFolder.bookmarkCount,
            createdAt = savedFolder.createdAt,
            updatedAt = savedFolder.updatedAt
        )
    }

    /**
     * Get user's bookmark folders
     */
    @Transactional(readOnly = true)
    fun getUserBookmarkFolders(userEmail: String): List<BookmarkFolderResponse> {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        return bookmarkFolderRepository.findByUserOrderByCreatedAtDesc(user).map { folder ->
            BookmarkFolderResponse(
                id = folder.id,
                name = folder.name,
                description = folder.description,
                bookmarkCount = folder.bookmarkCount,
                createdAt = folder.createdAt,
                updatedAt = folder.updatedAt
            )
        }
    }

    /**
     * Update bookmark folder
     */
    fun updateBookmarkFolder(
        userEmail: String,
        folderId: Long,
        request: UpdateBookmarkFolderRequest
    ): BookmarkFolderResponse {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        val folder = bookmarkFolderRepository.findByIdAndUser(folderId, user)
            ?: throw BookmarkFolderNotFoundException()

        // Check for duplicate name (excluding current folder)
        val existingFolder = bookmarkFolderRepository.findByUserAndName(user, request.name)
        if (existingFolder != null && existingFolder.id != folderId) {
            throw FolderNameAlreadyExistsException()
        }

        val updatedFolder = folder.copy(
            name = request.name,
            description = request.description,
            updatedAt = LocalDateTime.now()
        )

        val savedFolder = bookmarkFolderRepository.save(updatedFolder)

        return BookmarkFolderResponse(
            id = savedFolder.id,
            name = savedFolder.name,
            description = savedFolder.description,
            bookmarkCount = savedFolder.bookmarkCount,
            createdAt = savedFolder.createdAt,
            updatedAt = savedFolder.updatedAt
        )
    }

    /**
     * Delete bookmark folder (moves bookmarks to uncategorized)
     */
    fun deleteBookmarkFolder(userEmail: String, folderId: Long) {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        val folder = bookmarkFolderRepository.findByIdAndUser(folderId, user)
            ?: throw BookmarkFolderNotFoundException()

        // Move all bookmarks to uncategorized (folder = null)
        val bookmarksInFolder = promptBookmarkRepository.findByFolder(folder)
        bookmarksInFolder.forEach { bookmark ->
            val updatedBookmark = bookmark.copy(
                folder = null,
                updatedAt = LocalDateTime.now()
            )
            promptBookmarkRepository.save(updatedBookmark)
        }

        bookmarkFolderRepository.delete(folder)
    }

    /**
     * Move bookmark to a different folder
     */
    fun moveBookmark(userEmail: String, bookmarkId: Long, request: MoveBookmarkRequest): MoveBookmarkResponse {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        val bookmark = promptBookmarkRepository.findByIdAndUser(bookmarkId, user)
            ?: throw BookmarkNotFoundException()

        val targetFolder = request.folderId?.let { folderId ->
            bookmarkFolderRepository.findByIdAndUser(folderId, user)
                ?: throw BookmarkFolderNotFoundException()
        }

        val updatedBookmark = bookmark.copy(
            folder = targetFolder,
            updatedAt = LocalDateTime.now()
        )

        val savedBookmark = promptBookmarkRepository.save(updatedBookmark)

        return MoveBookmarkResponse(
            id = savedBookmark.id,
            promptId = savedBookmark.prompt.id,
            folderId = savedBookmark.folder?.id,
            createdAt = savedBookmark.createdAt,
            updatedAt = savedBookmark.updatedAt
        )
    }

    /**
     * Get popular bookmarked prompts
     */
    @Transactional(readOnly = true)
    fun getPopularBookmarkedPrompts(
        timeframe: String = "all",
        page: Int = 0,
        size: Int = 20
    ): Page<PromptResponse> {
        val pageable = PageRequest.of(page, size)

        val prompts = when (timeframe.lowercase()) {
            "week" -> {
                val since = LocalDateTime.now().minusWeeks(1)
                promptBookmarkRepository.findMostBookmarkedPromptsSince(since, pageable)
            }
            "month" -> {
                val since = LocalDateTime.now().minusMonths(1)
                promptBookmarkRepository.findMostBookmarkedPromptsSince(since, pageable)
            }
            else -> {
                promptBookmarkRepository.findMostBookmarkedPrompts(pageable)
            }
        }

        return prompts.map { prompt ->
            PromptResponse(
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
    }

    /**
     * Check if user has bookmarked a prompt
     */
    @Transactional(readOnly = true)
    fun isBookmarked(promptId: Long, userEmail: String): Boolean {
        val user = userRepository.findByEmail(userEmail)
            ?: throw UserNotFoundException()

        val prompt = promptRepository.findById(promptId)
            .orElseThrow { PromptNotFoundException() }

        return promptBookmarkRepository.existsByUserAndPrompt(user, prompt)
    }
}