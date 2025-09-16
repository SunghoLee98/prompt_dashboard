package com.promptdriver.service

import com.promptdriver.dto.request.CreateBookmarkFolderRequest
import com.promptdriver.entity.*
import com.promptdriver.exception.BusinessException
import com.promptdriver.repository.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import java.time.LocalDateTime
import java.util.*

@ExtendWith(MockitoExtension::class)
class BookmarkServiceTest {

    @Mock
    private lateinit var promptBookmarkRepository: PromptBookmarkRepository

    @Mock
    private lateinit var bookmarkFolderRepository: BookmarkFolderRepository

    @Mock
    private lateinit var promptRepository: PromptRepository

    @Mock
    private lateinit var userRepository: UserRepository

    @InjectMocks
    private lateinit var bookmarkService: BookmarkService

    private lateinit var testUser: User
    private lateinit var testAuthor: User
    private lateinit var testPrompt: Prompt

    @BeforeEach
    fun setup() {
        testUser = User(
            id = 1L,
            email = "user@test.com",
            password = "password",
            nickname = "testuser",
            role = UserRole.USER
        )

        testAuthor = User(
            id = 2L,
            email = "author@test.com",
            password = "password",
            nickname = "testauthor",
            role = UserRole.USER
        )

        testPrompt = Prompt(
            id = 1L,
            title = "Test Prompt",
            description = "Test Description",
            content = "Test Content",
            category = "coding",
            author = testAuthor,
            tags = setOf("test", "example")
        )
    }

    @Test
    fun `toggleBookmark should create bookmark when none exists`() {
        // Given
        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(promptRepository.findById(1L)).thenReturn(Optional.of(testPrompt))
        `when`(promptBookmarkRepository.findByUserAndPrompt(testUser, testPrompt)).thenReturn(null)
        `when`(promptBookmarkRepository.save(any(PromptBookmark::class.java))).thenReturn(
            PromptBookmark(id = 1L, user = testUser, prompt = testPrompt)
        )
        `when`(promptRepository.save(any(Prompt::class.java))).thenReturn(testPrompt)

        // When
        val result = bookmarkService.toggleBookmark(1L, "user@test.com")

        // Then
        assertTrue(result.bookmarked)
        assertEquals(1, result.bookmarkCount)
        verify(promptBookmarkRepository).save(any(PromptBookmark::class.java))
        verify(promptRepository).save(testPrompt)
    }

    @Test
    fun `toggleBookmark should remove bookmark when exists`() {
        // Given
        val existingBookmark = PromptBookmark(id = 1L, user = testUser, prompt = testPrompt)
        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(promptRepository.findById(1L)).thenReturn(Optional.of(testPrompt))
        `when`(promptBookmarkRepository.findByUserAndPrompt(testUser, testPrompt)).thenReturn(existingBookmark)
        `when`(promptRepository.save(any(Prompt::class.java))).thenReturn(testPrompt)

        // When
        val result = bookmarkService.toggleBookmark(1L, "user@test.com")

        // Then
        assertFalse(result.bookmarked)
        assertEquals(0, result.bookmarkCount)
        verify(promptBookmarkRepository).delete(existingBookmark)
        verify(promptRepository).save(testPrompt)
    }

    @Test
    fun `toggleBookmark should throw exception when user tries to bookmark own prompt`() {
        // Given
        `when`(userRepository.findByEmail("author@test.com")).thenReturn(testAuthor)
        `when`(promptRepository.findById(1L)).thenReturn(Optional.of(testPrompt))

        // When & Then
        val exception = assertThrows<BusinessException> {
            bookmarkService.toggleBookmark(1L, "author@test.com")
        }

        assertEquals("Cannot bookmark your own prompt", exception.message)
        assertEquals(HttpStatus.FORBIDDEN, exception.errorCode.status)
    }

    @Test
    fun `createBookmarkFolder should create folder successfully`() {
        // Given
        val request = CreateBookmarkFolderRequest("Test Folder", "Test Description")
        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(bookmarkFolderRepository.countByUser(testUser)).thenReturn(5L)
        `when`(bookmarkFolderRepository.existsByUserAndName(testUser, "Test Folder")).thenReturn(false)

        val savedFolder = BookmarkFolder(
            id = 1L,
            user = testUser,
            name = "Test Folder",
            description = "Test Description"
        )
        `when`(bookmarkFolderRepository.save(any(BookmarkFolder::class.java))).thenReturn(savedFolder)

        // When
        val result = bookmarkService.createBookmarkFolder("user@test.com", request)

        // Then
        assertEquals("Test Folder", result.name)
        assertEquals("Test Description", result.description)
        assertEquals(0, result.bookmarkCount)
        verify(bookmarkFolderRepository).save(any(BookmarkFolder::class.java))
    }

    @Test
    fun `createBookmarkFolder should throw exception when folder limit reached`() {
        // Given
        val request = CreateBookmarkFolderRequest("Test Folder", "Test Description")
        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(bookmarkFolderRepository.countByUser(testUser)).thenReturn(20L)

        // When & Then
        val exception = assertThrows<BusinessException> {
            bookmarkService.createBookmarkFolder("user@test.com", request)
        }

        assertEquals("Maximum bookmark folders limit exceeded", exception.message)
        assertEquals(HttpStatus.BAD_REQUEST, exception.errorCode.status)
    }

    @Test
    fun `createBookmarkFolder should throw exception when folder name exists`() {
        // Given
        val request = CreateBookmarkFolderRequest("Test Folder", "Test Description")
        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(bookmarkFolderRepository.countByUser(testUser)).thenReturn(5L)
        `when`(bookmarkFolderRepository.existsByUserAndName(testUser, "Test Folder")).thenReturn(true)

        // When & Then
        val exception = assertThrows<BusinessException> {
            bookmarkService.createBookmarkFolder("user@test.com", request)
        }

        assertEquals("Folder with this name already exists", exception.message)
        assertEquals(HttpStatus.CONFLICT, exception.errorCode.status)
    }

    @Test
    fun `getUserBookmarks should return paginated bookmarks`() {
        // Given
        val bookmark = PromptBookmark(id = 1L, user = testUser, prompt = testPrompt)
        val page = PageImpl(listOf(bookmark), PageRequest.of(0, 20), 1)

        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(promptBookmarkRepository.findByUserOrderByCreatedAtDesc(testUser, PageRequest.of(0, 20)))
            .thenReturn(page)

        // When
        val result = bookmarkService.getUserBookmarks("user@test.com", null, null, PageRequest.of(0, 20))

        // Then
        assertEquals(1, result.content.size)
        assertEquals("Test Prompt", result.content[0].prompt.title)
        assertEquals("testauthor", result.content[0].prompt.author.nickname)
    }

    @Test
    fun `isBookmarked should return true when bookmark exists`() {
        // Given
        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(promptRepository.findById(1L)).thenReturn(Optional.of(testPrompt))
        `when`(promptBookmarkRepository.existsByUserAndPrompt(testUser, testPrompt)).thenReturn(true)

        // When
        val result = bookmarkService.isBookmarked(1L, "user@test.com")

        // Then
        assertTrue(result)
    }

    @Test
    fun `isBookmarked should return false when bookmark does not exist`() {
        // Given
        `when`(userRepository.findByEmail("user@test.com")).thenReturn(testUser)
        `when`(promptRepository.findById(1L)).thenReturn(Optional.of(testPrompt))
        `when`(promptBookmarkRepository.existsByUserAndPrompt(testUser, testPrompt)).thenReturn(false)

        // When
        val result = bookmarkService.isBookmarked(1L, "user@test.com")

        // Then
        assertFalse(result)
    }
}