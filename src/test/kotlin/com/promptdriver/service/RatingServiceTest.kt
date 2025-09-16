package com.promptdriver.service

import com.promptdriver.dto.request.CreateRatingRequest
import com.promptdriver.dto.request.UpdateRatingRequest
import com.promptdriver.entity.Prompt
import com.promptdriver.entity.PromptRating
import com.promptdriver.entity.User
import com.promptdriver.entity.UserRole
import com.promptdriver.exception.*
import com.promptdriver.repository.PromptRatingRepository
import com.promptdriver.repository.PromptRepository
import com.promptdriver.repository.UserRepository
import io.mockk.*
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import java.util.Optional

@ExtendWith(MockKExtension::class)
class RatingServiceTest {

    @MockK
    private lateinit var promptRatingRepository: PromptRatingRepository

    @MockK
    private lateinit var promptRepository: PromptRepository

    @MockK
    private lateinit var userRepository: UserRepository

    @MockK
    private lateinit var htmlSafeList: Safelist

    @MockK
    private lateinit var securityContext: SecurityContext

    @MockK
    private lateinit var authentication: Authentication

    @InjectMockKs
    private lateinit var ratingService: RatingService

    private lateinit var user: User
    private lateinit var author: User
    private lateinit var prompt: Prompt
    private lateinit var rating: PromptRating

    @BeforeEach
    fun setUp() {
        user = User(
            id = 1L,
            email = "user@test.com",
            password = "password",
            nickname = "testuser",
            role = UserRole.USER
        )

        author = User(
            id = 2L,
            email = "author@test.com",
            password = "password",
            nickname = "author",
            role = UserRole.USER
        )

        prompt = Prompt(
            id = 1L,
            title = "Test Prompt",
            description = "Test Description",
            content = "Test Content",
            category = "coding",
            author = author
        )

        rating = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )

        // Mock SecurityContext with mockkStatic
        mockkStatic(SecurityContextHolder::class)
        every { SecurityContextHolder.getContext() } returns securityContext
        every { securityContext.authentication } returns authentication
        every { authentication.name } returns "user@test.com"
    }

    @AfterEach
    fun tearDown() {
        unmockkAll()
    }

    @Test
    fun `should create rating successfully`() {
        // Given
        val request = CreateRatingRequest(rating = 5)
        
        every { promptRepository.findById(1L) } returns Optional.of(prompt)
        every { userRepository.findById(1L) } returns Optional.of(user)
        every { promptRatingRepository.existsByPromptIdAndUserId(1L, 1L) } returns false
        every { promptRatingRepository.save(any()) } returns rating
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 5.0
        every { promptRatingRepository.countByPromptId(1L) } returns 1L
        every { promptRepository.save(any()) } returns prompt

        // When
        val response = ratingService.createRating(1L, 1L, request)

        // Then
        assertThat(response).isNotNull
        assertThat(response.id).isEqualTo(1L)
        assertThat(response.rating).isEqualTo(5)
        assertThat(response.averageRating).isEqualTo(5.0)
        assertThat(response.ratingCount).isEqualTo(1)
        
        verify { promptRatingRepository.save(any()) }
        verify { promptRepository.save(any()) }
    }

    @Test
    fun `should throw exception when user rates their own prompt`() {
        // Given
        val request = CreateRatingRequest(rating = 5)
        
        every { promptRepository.findById(1L) } returns Optional.of(prompt)
        every { userRepository.findById(2L) } returns Optional.of(author)

        // When & Then
        val exception = assertThrows<SelfRatingException> {
            ratingService.createRating(1L, 2L, request)
        }
        
        assertThat(exception.message).isEqualTo("You cannot rate your own prompt")
        verify(exactly = 0) { promptRatingRepository.save(any()) }
    }

    @Test
    fun `should throw exception when rating already exists`() {
        // Given
        val request = CreateRatingRequest(rating = 5)
        
        every { promptRepository.findById(1L) } returns Optional.of(prompt)
        every { userRepository.findById(1L) } returns Optional.of(user)
        every { promptRatingRepository.existsByPromptIdAndUserId(1L, 1L) } returns true

        // When & Then
        val exception = assertThrows<RatingAlreadyExistsException> {
            ratingService.createRating(1L, 1L, request)
        }
        
        assertThat(exception.message).isEqualTo("You have already rated this prompt")
        verify(exactly = 0) { promptRatingRepository.save(any()) }
    }

    @Test
    fun `should update rating successfully`() {
        // Given
        val request = UpdateRatingRequest(rating = 4)
        val updatedRating = rating.copy().apply { this.rating = 4 }
        
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.of(rating)
        every { promptRatingRepository.save(any()) } returns updatedRating
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 4.0
        every { promptRatingRepository.countByPromptId(1L) } returns 1L
        every { promptRepository.save(any()) } returns prompt

        // When
        val response = ratingService.updateRating(1L, 1L, request)

        // Then
        assertThat(response).isNotNull
        assertThat(response.id).isEqualTo(1L)
        assertThat(response.rating).isEqualTo(4)
        assertThat(response.averageRating).isEqualTo(4.0)
        assertThat(response.ratingCount).isEqualTo(1)
        
        verify { promptRatingRepository.save(any()) }
        verify { promptRepository.save(any()) }
    }

    @Test
    fun `should throw exception when updating non-existent rating`() {
        // Given
        val request = UpdateRatingRequest(rating = 4)
        
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<RatingNotFoundException> {
            ratingService.updateRating(1L, 1L, request)
        }
        
        assertThat(exception.message).isEqualTo("Rating not found for this prompt")
        verify(exactly = 0) { promptRatingRepository.save(any()) }
    }

    @Test
    fun `should delete rating successfully`() {
        // Given
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.of(rating)
        every { promptRatingRepository.delete(rating) } just Runs
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 0.0
        every { promptRatingRepository.countByPromptId(1L) } returns 0L
        every { promptRepository.findById(1L) } returns Optional.of(prompt)
        every { promptRepository.save(any()) } returns prompt

        // When
        val response = ratingService.deleteRating(1L, 1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response.averageRating).isEqualTo(0.0)
        assertThat(response.ratingCount).isEqualTo(0)
        
        verify { promptRatingRepository.delete(rating) }
        verify { promptRepository.save(any()) }
    }

    @Test
    fun `should get rating successfully`() {
        // Given
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.of(rating)

        // When
        val response = ratingService.getRating(1L, 1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response?.id).isEqualTo(1L)
        assertThat(response?.promptId).isEqualTo(1L)
        assertThat(response?.userId).isEqualTo(1L)
        assertThat(response?.userNickname).isEqualTo("testuser")
        assertThat(response?.rating).isEqualTo(5)
    }

    @Test
    fun `should return null when rating not found`() {
        // Given
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.empty()

        // When
        val response = ratingService.getRating(1L, 1L)

        // Then
        assertThat(response).isNull()
    }

    @Test
    fun `should get prompt ratings successfully`() {
        // Given
        val pageable = Pageable.unpaged()
        val ratings = listOf(rating)
        val page = PageImpl(ratings)
        
        every { promptRatingRepository.findAllByPromptId(1L, pageable) } returns page

        // When
        val response = ratingService.getPromptRatings(1L, pageable)

        // Then
        assertThat(response).isNotNull
        assertThat(response.totalElements).isEqualTo(1)
        assertThat(response.content.size).isEqualTo(1)
        assertThat(response.content[0].rating).isEqualTo(5)
    }

    @Test
    fun `should get user ratings successfully`() {
        // Given
        val pageable = Pageable.unpaged()
        val ratings = listOf(rating)
        val page = PageImpl(ratings)
        
        every { promptRatingRepository.findAllByUserId(1L, pageable) } returns page

        // When
        val response = ratingService.getUserRatings(1L, pageable)

        // Then
        assertThat(response).isNotNull
        assertThat(response.totalElements).isEqualTo(1)
        assertThat(response.content.size).isEqualTo(1)
        assertThat(response.content[0].rating).isEqualTo(5)
    }

    @Test
    fun `should get rating stats successfully`() {
        // Given
        val ratings = listOf(
            rating,
            PromptRating(id = 2L, prompt = prompt, user = user, rating = 4)
        )
        val page = PageImpl(ratings)
        
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 4.5
        every { promptRatingRepository.countByPromptId(1L) } returns 2L
        every { promptRatingRepository.findUserRatingForPrompt(1L, 1L) } returns 5
        every { promptRatingRepository.findAllByPromptId(1L, Pageable.unpaged()) } returns page

        // When
        val response = ratingService.getRatingStats(1L, 1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response.averageRating).isEqualTo(4.5)
        assertThat(response.ratingCount).isEqualTo(2)
        assertThat(response.userRating).isEqualTo(5)
        assertThat(response.distribution[4]).isEqualTo(1)
        assertThat(response.distribution[5]).isEqualTo(1)
        assertThat(response.distribution[1]).isEqualTo(0)
        assertThat(response.distribution[2]).isEqualTo(0)
        assertThat(response.distribution[3]).isEqualTo(0)
    }

    @Test
    fun `should validate rating value range`() {
        // Given
        val invalidRatings = listOf(0, 6, -1, 10)
        
        // When & Then
        invalidRatings.forEach { invalidRating ->
            assertThrows<IllegalArgumentException> {
                PromptRating(
                    prompt = prompt,
                    user = user,
                    rating = invalidRating
                )
            }
        }
    }

    @Test
    fun `should allow valid rating values`() {
        // Given
        val validRatings = listOf(1, 2, 3, 4, 5)
        
        // When & Then
        validRatings.forEach { validRating ->
            val testRating = PromptRating(
                prompt = prompt,
                user = user,
                rating = validRating
            )
            assertThat(testRating.rating).isEqualTo(validRating)
        }
    }

    @Test
    fun `should get current user rating through service method`() {
        // Given
        every { userRepository.findByEmail("user@test.com") } returns user
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.of(rating)

        // When
        val response = ratingService.getMyRating(1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response?.rating).isEqualTo(5)
    }

    @Test
    fun `should create rating for current user`() {
        // Given
        val request = CreateRatingRequest(rating = 5)
        
        every { userRepository.findByEmail("user@test.com") } returns user
        every { promptRepository.findById(1L) } returns Optional.of(prompt)
        every { userRepository.findById(1L) } returns Optional.of(user)
        every { promptRatingRepository.existsByPromptIdAndUserId(1L, 1L) } returns false
        every { promptRatingRepository.save(any()) } returns rating
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 5.0
        every { promptRatingRepository.countByPromptId(1L) } returns 1L
        every { promptRepository.save(any()) } returns prompt

        // When
        val response = ratingService.createRating(1L, request)

        // Then
        assertThat(response).isNotNull
        assertThat(response.rating).isEqualTo(5)
    }

    @Test
    fun `should throw exception when prompt not found`() {
        // Given
        val request = CreateRatingRequest(rating = 5)
        
        every { promptRepository.findById(1L) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<PromptNotFoundException> {
            ratingService.createRating(1L, 1L, request)
        }
        
        assertThat(exception.message).isEqualTo("Prompt with id 1 not found")
        verify(exactly = 0) { promptRatingRepository.save(any()) }
    }

    @Test
    fun `should throw exception when user not found`() {
        // Given
        val request = CreateRatingRequest(rating = 5)
        
        every { promptRepository.findById(1L) } returns Optional.of(prompt)
        every { userRepository.findById(999L) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<UserNotFoundException> {
            ratingService.createRating(1L, 999L, request)
        }
        
        assertThat(exception.message).isEqualTo("User with id 999 not found")
        verify(exactly = 0) { promptRatingRepository.save(any()) }
    }

    @Test
    fun `should throw exception when updating with wrong user`() {
        // Given
        val request = UpdateRatingRequest(rating = 4)
        val otherUser = User(
            id = 999L,
            email = "other@test.com",
            password = "password",
            nickname = "other",
            role = UserRole.USER
        )
        val otherRating = PromptRating(
            id = 1L,
            prompt = prompt,
            user = otherUser,
            rating = 5
        )
        
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.of(otherRating)

        // When & Then
        val exception = assertThrows<UnauthorizedRatingAccessException> {
            ratingService.updateRating(1L, 1L, request)
        }
        
        assertThat(exception.message).isEqualTo("You can only update your own ratings")
        verify(exactly = 0) { promptRatingRepository.save(any()) }
    }

    @Test
    fun `should throw exception when deleting with wrong user`() {
        // Given
        val otherUser = User(
            id = 999L,
            email = "other@test.com",
            password = "password",
            nickname = "other",
            role = UserRole.USER
        )
        val otherRating = PromptRating(
            id = 1L,
            prompt = prompt,
            user = otherUser,
            rating = 5
        )
        
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.of(otherRating)

        // When & Then
        val exception = assertThrows<UnauthorizedRatingAccessException> {
            ratingService.deleteRating(1L, 1L)
        }
        
        assertThat(exception.message).isEqualTo("You can only delete your own ratings")
        verify(exactly = 0) { promptRatingRepository.delete(any()) }
    }

    @Test
    fun `should throw exception when deleting non-existent rating`() {
        // Given
        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<RatingNotFoundException> {
            ratingService.deleteRating(1L, 1L)
        }
        
        assertThat(exception.message).isEqualTo("Rating not found for this prompt")
        verify(exactly = 0) { promptRatingRepository.delete(any()) }
    }

    @Test
    fun `should handle null average rating when no ratings exist`() {
        // Given
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns null
        every { promptRatingRepository.countByPromptId(1L) } returns 0L
        every { promptRatingRepository.findUserRatingForPrompt(1L, 1L) } returns null
        every { promptRatingRepository.findAllByPromptId(1L, Pageable.unpaged()) } returns PageImpl(emptyList())

        // When
        val response = ratingService.getRatingStats(1L, 1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response.averageRating).isEqualTo(0.0)
        assertThat(response.ratingCount).isEqualTo(0)
        assertThat(response.userRating).isNull()
        assertThat(response.distribution[1]).isEqualTo(0)
        assertThat(response.distribution[5]).isEqualTo(0)
    }

    @Test
    fun `should get rating stats without user id`() {
        // Given
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 4.5
        every { promptRatingRepository.countByPromptId(1L) } returns 2L
        every { promptRatingRepository.findAllByPromptId(1L, Pageable.unpaged()) } returns PageImpl(listOf(rating))

        // When
        val response = ratingService.getRatingStats(1L, null)

        // Then
        assertThat(response).isNotNull
        assertThat(response.averageRating).isEqualTo(4.5)
        assertThat(response.ratingCount).isEqualTo(2)
        assertThat(response.userRating).isNull()
    }

    @Test
    fun `should handle authentication context when getting rating stats`() {
        // Given
        every { userRepository.findByEmail("user@test.com") } returns user
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 4.5
        every { promptRatingRepository.countByPromptId(1L) } returns 2L
        every { promptRatingRepository.findUserRatingForPrompt(1L, 1L) } returns 5
        every { promptRatingRepository.findAllByPromptId(1L, Pageable.unpaged()) } returns PageImpl(listOf(rating))

        // When
        val response = ratingService.getRatingStats(1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response.averageRating).isEqualTo(4.5)
        assertThat(response.ratingCount).isEqualTo(2)
        assertThat(response.userRating).isEqualTo(5)
    }

    @Test
    fun `should handle no authentication when getting rating stats`() {
        // Given
        every { securityContext.authentication } returns null
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 4.5
        every { promptRatingRepository.countByPromptId(1L) } returns 2L
        every { promptRatingRepository.findAllByPromptId(1L, Pageable.unpaged()) } returns PageImpl(listOf(rating))

        // When
        val response = ratingService.getRatingStats(1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response.averageRating).isEqualTo(4.5)
        assertThat(response.ratingCount).isEqualTo(2)
        assertThat(response.userRating).isNull()
    }

    @Test
    fun `should throw UnauthorizedAccessException when no user authenticated for create`() {
        // Given
        val request = CreateRatingRequest(rating = 5)
        every { userRepository.findByEmail("user@test.com") } returns null

        // When & Then
        val exception = assertThrows<UnauthorizedAccessException> {
            ratingService.createRating(1L, request)
        }
        
        assertThat(exception.message).isEqualTo("User not authenticated")
    }

    @Test
    fun `should throw UnauthorizedAccessException when no user authenticated for update`() {
        // Given
        val request = UpdateRatingRequest(rating = 4)
        every { userRepository.findByEmail("user@test.com") } returns null

        // When & Then
        val exception = assertThrows<UnauthorizedAccessException> {
            ratingService.updateRating(1L, request)
        }
        
        assertThat(exception.message).isEqualTo("User not authenticated")
    }

    @Test
    fun `should throw UnauthorizedAccessException when no user authenticated for delete`() {
        // Given
        every { userRepository.findByEmail("user@test.com") } returns null

        // When & Then
        val exception = assertThrows<UnauthorizedAccessException> {
            ratingService.deleteRating(1L)
        }
        
        assertThat(exception.message).isEqualTo("User not authenticated")
    }

    @Test
    fun `should throw UnauthorizedAccessException when no user authenticated for getMyRating`() {
        // Given
        every { userRepository.findByEmail("user@test.com") } returns null

        // When & Then
        val exception = assertThrows<UnauthorizedAccessException> {
            ratingService.getMyRating(1L)
        }
        
        assertThat(exception.message).isEqualTo("User not authenticated")
    }

    @Test
    fun `should handle updateRating method in PromptRating entity`() {
        // Given
        val testRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3
        )

        // When
        testRating.updateRating(5, "Updated comment")

        // Then
        assertThat(testRating.rating).isEqualTo(5)
        assertThat(testRating.comment).isEqualTo("Updated comment")
    }

    @Test
    fun `should throw exception when updateRating with invalid value`() {
        // Given
        val testRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3
        )

        // When & Then
        assertThrows<IllegalArgumentException> {
            testRating.updateRating(6, "Comment")
        }
    }

    @Test
    fun `should test equals and hashCode methods`() {
        // Given
        val rating1 = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )
        val rating2 = PromptRating(
            id = 1L,
            prompt = prompt,
            user = author,
            rating = 3
        )
        val rating3 = PromptRating(
            id = 2L,
            prompt = prompt,
            user = user,
            rating = 5
        )

        // Then
        assertThat(rating1).isEqualTo(rating1) // same object
        assertThat(rating1).isEqualTo(rating2) // same id
        assertThat(rating1).isNotEqualTo(rating3) // different id
        assertThat(rating1).isNotEqualTo(null)
        assertThat(rating1).isNotEqualTo("string")
        
        assertThat(rating1.hashCode()).isEqualTo(rating2.hashCode())
        assertThat(rating1.hashCode()).isNotEqualTo(rating3.hashCode())
    }

    @Test
    fun `should handle rating distribution with all rating values`() {
        // Given
        val ratings = listOf(
            PromptRating(id = 1L, prompt = prompt, user = user, rating = 1),
            PromptRating(id = 2L, prompt = prompt, user = user, rating = 1),
            PromptRating(id = 3L, prompt = prompt, user = user, rating = 2),
            PromptRating(id = 4L, prompt = prompt, user = user, rating = 3),
            PromptRating(id = 5L, prompt = prompt, user = user, rating = 3),
            PromptRating(id = 6L, prompt = prompt, user = user, rating = 3),
            PromptRating(id = 7L, prompt = prompt, user = user, rating = 4),
            PromptRating(id = 8L, prompt = prompt, user = user, rating = 4),
            PromptRating(id = 9L, prompt = prompt, user = user, rating = 4),
            PromptRating(id = 10L, prompt = prompt, user = user, rating = 4),
            PromptRating(id = 11L, prompt = prompt, user = user, rating = 5),
            PromptRating(id = 12L, prompt = prompt, user = user, rating = 5),
            PromptRating(id = 13L, prompt = prompt, user = user, rating = 5),
            PromptRating(id = 14L, prompt = prompt, user = user, rating = 5),
            PromptRating(id = 15L, prompt = prompt, user = user, rating = 5)
        )
        val page = PageImpl(ratings)
        
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 3.6
        every { promptRatingRepository.countByPromptId(1L) } returns 15L
        every { promptRatingRepository.findUserRatingForPrompt(1L, 1L) } returns null
        every { promptRatingRepository.findAllByPromptId(1L, Pageable.unpaged()) } returns page

        // When
        val response = ratingService.getRatingStats(1L, 1L)

        // Then
        assertThat(response).isNotNull
        assertThat(response.averageRating).isEqualTo(3.6)
        assertThat(response.ratingCount).isEqualTo(15)
        assertThat(response.distribution[1]).isEqualTo(2)
        assertThat(response.distribution[2]).isEqualTo(1)
        assertThat(response.distribution[3]).isEqualTo(3)
        assertThat(response.distribution[4]).isEqualTo(4)
        assertThat(response.distribution[5]).isEqualTo(5)
    }

    @Test
    fun `should create rating with comment successfully`() {
        // Given
        val request = CreateRatingRequest(rating = 5, comment = "Great prompt!")
        val ratingWithComment = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5,
            comment = "Great prompt!"
        )

        mockkStatic("org.jsoup.Jsoup")
        every { org.jsoup.Jsoup.clean(any(), any<Safelist>()) } returns "Great prompt!"

        every { promptRepository.findById(1L) } returns Optional.of(prompt)
        every { userRepository.findById(1L) } returns Optional.of(user)
        every { promptRatingRepository.existsByPromptIdAndUserId(1L, 1L) } returns false
        every { promptRatingRepository.save(any()) } returns ratingWithComment
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 5.0
        every { promptRatingRepository.countByPromptId(1L) } returns 1L
        every { promptRepository.save(any()) } returns prompt

        // When
        val response = ratingService.createRating(1L, 1L, request)

        // Then
        assertThat(response).isNotNull
        assertThat(response.rating).isEqualTo(5)
        verify { promptRatingRepository.save(any()) }
        unmockkStatic("org.jsoup.Jsoup")
    }

    @Test
    fun `should update rating with comment successfully`() {
        // Given
        val request = UpdateRatingRequest(rating = 4, comment = "Updated comment")
        val updatedRating = rating.copy().apply {
            this.rating = 4
            this.comment = "Updated comment"
        }

        mockkStatic("org.jsoup.Jsoup")
        every { org.jsoup.Jsoup.clean(any(), any<Safelist>()) } returns "Updated comment"

        every { promptRatingRepository.findByPromptIdAndUserId(1L, 1L) } returns Optional.of(rating)
        every { promptRatingRepository.save(any()) } returns updatedRating
        every { promptRatingRepository.findAverageRatingByPromptId(1L) } returns 4.0
        every { promptRatingRepository.countByPromptId(1L) } returns 1L
        every { promptRepository.save(any()) } returns prompt

        // When
        val response = ratingService.updateRating(1L, 1L, request)

        // Then
        assertThat(response).isNotNull
        assertThat(response.rating).isEqualTo(4)
        verify { promptRatingRepository.save(any()) }
        unmockkStatic("org.jsoup.Jsoup")
    }

    @Test
    fun `should normalize empty comment to null`() {
        // Given
        val testRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3,
            comment = "   "  // Whitespace only
        )

        // Then
        assertThat(testRating.comment).isNull()
    }

    @Test
    fun `should trim comment whitespace`() {
        // Given
        val testRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3,
            comment = "  Good prompt!  "
        )

        // Then
        assertThat(testRating.comment).isEqualTo("Good prompt!")
    }
}