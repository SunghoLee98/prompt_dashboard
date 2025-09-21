package com.promptdriver.controller

import com.promptdriver.dto.request.CreateBookmarkFolderRequest
import com.promptdriver.dto.request.MoveBookmarkRequest
import com.promptdriver.dto.request.UpdateBookmarkFolderRequest
import com.promptdriver.dto.response.*
import com.promptdriver.service.BookmarkService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
@Tag(name = "Bookmarks", description = "Bookmark management operations")
class BookmarkController(
    private val bookmarkService: BookmarkService
) {

    @Operation(summary = "Bookmark or unbookmark a prompt")
    @PostMapping("/prompts/{promptId}/bookmark")
    fun toggleBookmark(
        @Parameter(description = "Prompt ID") @PathVariable promptId: Long,
        authentication: Authentication
    ): ResponseEntity<BookmarkToggleResponse> {
        val userEmail = authentication.name
        val response = bookmarkService.toggleBookmark(promptId, userEmail)
        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Get user's bookmarks")
    @GetMapping("/users/me/bookmarks")
    fun getUserBookmarks(
        @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") sort: String,
        @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") direction: String,
        @Parameter(description = "Filter by folder ID") @RequestParam(required = false) folderId: Long?,
        @Parameter(description = "Search in bookmark content") @RequestParam(required = false) search: String?,
        authentication: Authentication
    ): ResponseEntity<PageResponse<BookmarkResponse>> {
        val userEmail = authentication.name
        val sortDirection = if (direction.lowercase() == "desc") Sort.Direction.DESC else Sort.Direction.ASC
        val pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort))

        val bookmarks = bookmarkService.getUserBookmarks(userEmail, folderId, search, pageable)

        val response = PageResponse(
            content = bookmarks.content,
            totalElements = bookmarks.totalElements,
            totalPages = bookmarks.totalPages,
            page = bookmarks.number,
            size = bookmarks.size,
            first = bookmarks.isFirst,
            last = bookmarks.isLast
        )

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Create a bookmark folder")
    @PostMapping("/users/me/bookmark-folders")
    fun createBookmarkFolder(
        @Valid @RequestBody request: CreateBookmarkFolderRequest,
        authentication: Authentication
    ): ResponseEntity<BookmarkFolderResponse> {
        val userEmail = authentication.name
        val response = bookmarkService.createBookmarkFolder(userEmail, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @Operation(summary = "Get user's bookmark folders")
    @GetMapping("/users/me/bookmark-folders")
    fun getUserBookmarkFolders(
        authentication: Authentication
    ): ResponseEntity<List<BookmarkFolderResponse>> {
        val userEmail = authentication.name
        val response = bookmarkService.getUserBookmarkFolders(userEmail)
        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Update a bookmark folder")
    @PutMapping("/users/me/bookmark-folders/{id}")
    fun updateBookmarkFolder(
        @Parameter(description = "Folder ID") @PathVariable id: Long,
        @Valid @RequestBody request: UpdateBookmarkFolderRequest,
        authentication: Authentication
    ): ResponseEntity<BookmarkFolderResponse> {
        val userEmail = authentication.name
        val response = bookmarkService.updateBookmarkFolder(userEmail, id, request)
        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Delete a bookmark folder")
    @DeleteMapping("/users/me/bookmark-folders/{id}")
    fun deleteBookmarkFolder(
        @Parameter(description = "Folder ID") @PathVariable id: Long,
        authentication: Authentication
    ): ResponseEntity<Void> {
        val userEmail = authentication.name
        bookmarkService.deleteBookmarkFolder(userEmail, id)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "Move bookmark to folder")
    @PutMapping("/users/me/bookmarks/{bookmarkId}/folder")
    fun moveBookmark(
        @Parameter(description = "Bookmark ID") @PathVariable bookmarkId: Long,
        @Valid @RequestBody request: MoveBookmarkRequest,
        authentication: Authentication
    ): ResponseEntity<MoveBookmarkResponse> {
        val userEmail = authentication.name
        val response = bookmarkService.moveBookmark(userEmail, bookmarkId, request)
        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Get popular bookmarked prompts")
    @GetMapping("/prompts/popular-bookmarks")
    fun getPopularBookmarkedPrompts(
        @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") page: Int,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "20") size: Int,
        @Parameter(description = "Timeframe: week, month, all") @RequestParam(defaultValue = "all") timeframe: String
    ): ResponseEntity<PageResponse<PromptResponse>> {
        val prompts = bookmarkService.getPopularBookmarkedPrompts(timeframe, page, size)

        val response = PageResponse(
            content = prompts.content,
            totalElements = prompts.totalElements,
            totalPages = prompts.totalPages,
            page = prompts.number,
            size = prompts.size,
            first = prompts.isFirst,
            last = prompts.isLast
        )

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "Check if prompt is bookmarked by current user")
    @GetMapping("/prompts/{promptId}/bookmark/status")
    fun getBookmarkStatus(
        @Parameter(description = "Prompt ID") @PathVariable promptId: Long,
        authentication: Authentication
    ): ResponseEntity<Map<String, Boolean>> {
        val userEmail = authentication.name
        val isBookmarked = bookmarkService.isBookmarked(promptId, userEmail)
        return ResponseEntity.ok(mapOf("bookmarked" to isBookmarked))
    }
}