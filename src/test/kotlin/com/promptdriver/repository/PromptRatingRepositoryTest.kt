package com.promptdriver.repository

import com.promptdriver.entity.Prompt
import com.promptdriver.entity.PromptRating
import com.promptdriver.entity.User
import com.promptdriver.entity.UserRole
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import jakarta.validation.ConstraintViolationException

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@ActiveProfiles("test")
@Transactional
class PromptRatingRepositoryTest {

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Autowired
    private lateinit var promptRatingRepository: PromptRatingRepository

    @Autowired
    private lateinit var userRepository: UserRepository

    @Autowired
    private lateinit var promptRepository: PromptRepository

    private lateinit var user1: User
    private lateinit var user2: User
    private lateinit var user3: User
    private lateinit var author: User
    private lateinit var prompt1: Prompt
    private lateinit var prompt2: Prompt

    @BeforeEach
    fun setUp() {
        // Create test users
        user1 = User(
            email = "user1@test.com",
            password = "password",
            nickname = "user1",
            role = UserRole.USER
        )
        user1 = userRepository.save(user1)

        user2 = User(
            email = "user2@test.com",
            password = "password",
            nickname = "user2",
            role = UserRole.USER
        )
        user2 = userRepository.save(user2)

        user3 = User(
            email = "user3@test.com",
            password = "password",
            nickname = "user3",
            role = UserRole.USER
        )
        user3 = userRepository.save(user3)

        author = User(
            email = "author@test.com",
            password = "password",
            nickname = "author",
            role = UserRole.USER
        )
        author = userRepository.save(author)

        // Create test prompts
        prompt1 = Prompt(
            title = "Test Prompt 1",
            description = "Description 1",
            content = "Content 1",
            category = "coding",
            author = author
        )
        prompt1 = promptRepository.save(prompt1)

        prompt2 = Prompt(
            title = "Test Prompt 2",
            description = "Description 2",
            content = "Content 2",
            category = "writing",
            author = author
        )
        prompt2 = promptRepository.save(prompt2)

        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `should save and find rating by id`() {
        // Given
        val rating = PromptRating(
            prompt = prompt1,
            user = user1,
            rating = 5
        )
        val savedRating = promptRatingRepository.save(rating)
        entityManager.flush()

        // When
        val foundRating = promptRatingRepository.findById(savedRating.id).orElse(null)

        // Then
        assertThat(foundRating).isNotNull
        assertThat(foundRating.prompt.id).isEqualTo(prompt1.id)
        assertThat(foundRating.user.id).isEqualTo(user1.id)
        assertThat(foundRating.rating).isEqualTo(5)
    }

    @Test
    fun `should find rating by prompt id and user id`() {
        // Given
        val rating = PromptRating(
            prompt = prompt1,
            user = user1,
            rating = 4
        )
        promptRatingRepository.save(rating)
        entityManager.flush()

        // When
        val foundRating = promptRatingRepository.findByPromptIdAndUserId(prompt1.id, user1.id)

        // Then
        assertThat(foundRating).isPresent
        assertThat(foundRating.get().rating).isEqualTo(4)
    }

    @Test
    fun `should return empty when rating not found by prompt id and user id`() {
        // When
        val foundRating = promptRatingRepository.findByPromptIdAndUserId(prompt1.id, user1.id)

        // Then
        assertThat(foundRating).isEmpty
    }

    @Test
    fun `should find rating by prompt and user entities`() {
        // Given
        val rating = PromptRating(
            prompt = prompt1,
            user = user1,
            rating = 3
        )
        promptRatingRepository.save(rating)
        entityManager.flush()

        // When
        val foundRating = promptRatingRepository.findByPromptAndUser(prompt1, user1)

        // Then
        assertThat(foundRating).isPresent
        assertThat(foundRating.get().rating).isEqualTo(3)
    }

    @Test
    fun `should check if rating exists by prompt id and user id`() {
        // Given
        val rating = PromptRating(
            prompt = prompt1,
            user = user1,
            rating = 5
        )
        promptRatingRepository.save(rating)
        entityManager.flush()

        // When
        val exists = promptRatingRepository.existsByPromptIdAndUserId(prompt1.id, user1.id)
        val notExists = promptRatingRepository.existsByPromptIdAndUserId(prompt2.id, user1.id)

        // Then
        assertThat(exists).isTrue
        assertThat(notExists).isFalse
    }

    @Test
    fun `should find all ratings by prompt id with pagination`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val rating2 = PromptRating(prompt = prompt1, user = user2, rating = 4)
        val rating3 = PromptRating(prompt = prompt1, user = user3, rating = 3)
        promptRatingRepository.saveAll(listOf(rating1, rating2, rating3))
        entityManager.flush()

        // When
        val pageable = PageRequest.of(0, 2, Sort.by("rating").descending())
        val page = promptRatingRepository.findAllByPromptId(prompt1.id, pageable)

        // Then
        assertThat(page.totalElements).isEqualTo(3)
        assertThat(page.totalPages).isEqualTo(2)
        assertThat(page.content).hasSize(2)
        assertThat(page.content[0].rating).isEqualTo(5)
        assertThat(page.content[1].rating).isEqualTo(4)
    }

    @Test
    fun `should find all ratings by user id with pagination`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val rating2 = PromptRating(prompt = prompt2, user = user1, rating = 4)
        promptRatingRepository.saveAll(listOf(rating1, rating2))
        entityManager.flush()

        // When
        val pageable = PageRequest.of(0, 10)
        val page = promptRatingRepository.findAllByUserId(user1.id, pageable)

        // Then
        assertThat(page.totalElements).isEqualTo(2)
        assertThat(page.content).hasSize(2)
        assertThat(page.content.map { it.rating }).containsExactlyInAnyOrder(5, 4)
    }

    @Test
    fun `should calculate average rating by prompt id`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val rating2 = PromptRating(prompt = prompt1, user = user2, rating = 4)
        val rating3 = PromptRating(prompt = prompt1, user = user3, rating = 3)
        promptRatingRepository.saveAll(listOf(rating1, rating2, rating3))
        entityManager.flush()

        // When
        val averageRating = promptRatingRepository.findAverageRatingByPromptId(prompt1.id)

        // Then
        assertThat(averageRating).isNotNull
        assertThat(averageRating).isEqualTo(4.0)
    }

    @Test
    fun `should return null average rating when no ratings exist`() {
        // When
        val averageRating = promptRatingRepository.findAverageRatingByPromptId(prompt1.id)

        // Then
        assertThat(averageRating).isNull()
    }

    @Test
    fun `should count ratings by prompt id`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val rating2 = PromptRating(prompt = prompt1, user = user2, rating = 4)
        val rating3 = PromptRating(prompt = prompt1, user = user3, rating = 3)
        promptRatingRepository.saveAll(listOf(rating1, rating2, rating3))
        entityManager.flush()

        // When
        val count = promptRatingRepository.countByPromptId(prompt1.id)

        // Then
        assertThat(count).isEqualTo(3)
    }

    @Test
    fun `should return zero count when no ratings exist`() {
        // When
        val count = promptRatingRepository.countByPromptId(prompt1.id)

        // Then
        assertThat(count).isEqualTo(0)
    }

    @Test
    fun `should find user rating for prompt`() {
        // Given
        val rating = PromptRating(prompt = prompt1, user = user1, rating = 4)
        promptRatingRepository.save(rating)
        entityManager.flush()

        // When
        val userRating = promptRatingRepository.findUserRatingForPrompt(prompt1.id, user1.id)

        // Then
        assertThat(userRating).isNotNull
        assertThat(userRating).isEqualTo(4)
    }

    @Test
    fun `should return null when user rating not found`() {
        // When
        val userRating = promptRatingRepository.findUserRatingForPrompt(prompt1.id, user1.id)

        // Then
        assertThat(userRating).isNull()
    }

    @Test
    fun `should delete rating by prompt id and user id`() {
        // Given
        val rating = PromptRating(prompt = prompt1, user = user1, rating = 5)
        promptRatingRepository.save(rating)
        entityManager.flush()

        // When
        promptRatingRepository.deleteByPromptIdAndUserId(prompt1.id, user1.id)
        entityManager.flush()

        // Then
        val exists = promptRatingRepository.existsByPromptIdAndUserId(prompt1.id, user1.id)
        assertThat(exists).isFalse
    }

    @Test
    fun `should update existing rating`() {
        // Given
        val rating = PromptRating(prompt = prompt1, user = user1, rating = 3)
        val savedRating = promptRatingRepository.save(rating)
        entityManager.flush()
        entityManager.clear()

        // When
        val foundRating = promptRatingRepository.findById(savedRating.id).orElseThrow()
        foundRating.updateRating(5)
        promptRatingRepository.save(foundRating)
        entityManager.flush()
        entityManager.clear()

        // Then
        val updatedRating = promptRatingRepository.findById(savedRating.id).orElseThrow()
        assertThat(updatedRating.rating).isEqualTo(5)
    }

    @Test
    fun `should delete rating entity`() {
        // Given
        val rating = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val savedRating = promptRatingRepository.save(rating)
        entityManager.flush()

        // When
        promptRatingRepository.delete(savedRating)
        entityManager.flush()

        // Then
        val exists = promptRatingRepository.existsById(savedRating.id)
        assertThat(exists).isFalse
    }

    @Test
    fun `should enforce unique constraint on user and prompt combination`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        promptRatingRepository.save(rating1)
        entityManager.flush()

        // When & Then
        val rating2 = PromptRating(prompt = prompt1, user = user1, rating = 4)
        assertThrows<DataIntegrityViolationException> {
            promptRatingRepository.save(rating2)
            entityManager.flush()
        }
    }

    @Test
    fun `should allow same user to rate different prompts`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val rating2 = PromptRating(prompt = prompt2, user = user1, rating = 4)

        // When
        promptRatingRepository.save(rating1)
        promptRatingRepository.save(rating2)
        entityManager.flush()

        // Then
        val count = promptRatingRepository.findAllByUserId(user1.id, PageRequest.of(0, 10)).totalElements
        assertThat(count).isEqualTo(2)
    }

    @Test
    fun `should allow different users to rate same prompt`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val rating2 = PromptRating(prompt = prompt1, user = user2, rating = 4)
        val rating3 = PromptRating(prompt = prompt1, user = user3, rating = 3)

        // When
        promptRatingRepository.saveAll(listOf(rating1, rating2, rating3))
        entityManager.flush()

        // Then
        val count = promptRatingRepository.countByPromptId(prompt1.id)
        assertThat(count).isEqualTo(3)
    }

    @Test
    fun `should handle pagination correctly`() {
        // Given
        val ratings = mutableListOf<PromptRating>()
        for (i in 1..10) {
            val user = User(
                email = "paginationuser$i@test.com",
                password = "password",
                nickname = "paginationUser$i",
                role = UserRole.USER
            )
            val savedUser = userRepository.save(user)
            entityManager.flush()  // Flush after each user save
            ratings.add(PromptRating(prompt = prompt1, user = savedUser, rating = (i % 5) + 1))
        }
        promptRatingRepository.saveAll(ratings)
        entityManager.flush()

        // When
        val page1 = promptRatingRepository.findAllByPromptId(prompt1.id, PageRequest.of(0, 3))
        val page2 = promptRatingRepository.findAllByPromptId(prompt1.id, PageRequest.of(1, 3))
        val page3 = promptRatingRepository.findAllByPromptId(prompt1.id, PageRequest.of(2, 3))
        val page4 = promptRatingRepository.findAllByPromptId(prompt1.id, PageRequest.of(3, 3))

        // Then
        assertThat(page1.content).hasSize(3)
        assertThat(page2.content).hasSize(3)
        assertThat(page3.content).hasSize(3)
        assertThat(page4.content).hasSize(1)
        assertThat(page1.totalElements).isEqualTo(10)
        assertThat(page1.totalPages).isEqualTo(4)
    }

    @Test
    fun `should sort ratings correctly`() {
        // Given
        val rating1 = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val rating2 = PromptRating(prompt = prompt1, user = user2, rating = 3)
        val rating3 = PromptRating(prompt = prompt1, user = user3, rating = 4)
        promptRatingRepository.saveAll(listOf(rating1, rating2, rating3))
        entityManager.flush()

        // When
        val sortedByRatingAsc = promptRatingRepository.findAllByPromptId(
            prompt1.id, 
            PageRequest.of(0, 10, Sort.by("rating").ascending())
        )
        val sortedByRatingDesc = promptRatingRepository.findAllByPromptId(
            prompt1.id, 
            PageRequest.of(0, 10, Sort.by("rating").descending())
        )

        // Then
        assertThat(sortedByRatingAsc.content.map { it.rating }).containsExactly(3, 4, 5)
        assertThat(sortedByRatingDesc.content.map { it.rating }).containsExactly(5, 4, 3)
    }

    @Test
    fun `should handle empty result sets properly`() {
        // When
        val emptyPage = promptRatingRepository.findAllByPromptId(prompt1.id, PageRequest.of(0, 10))
        val emptyUserPage = promptRatingRepository.findAllByUserId(user1.id, PageRequest.of(0, 10))

        // Then
        assertThat(emptyPage.content).isEmpty()
        assertThat(emptyPage.totalElements).isEqualTo(0)
        assertThat(emptyUserPage.content).isEmpty()
        assertThat(emptyUserPage.totalElements).isEqualTo(0)
    }

    @Test
    fun `should test lazy loading of relationships`() {
        // Given
        val rating = PromptRating(prompt = prompt1, user = user1, rating = 5)
        val savedRating = promptRatingRepository.save(rating)
        entityManager.flush()
        entityManager.clear()

        // When
        val foundRating = promptRatingRepository.findById(savedRating.id).orElseThrow()

        // Then
        // Relationships should be lazy loaded
        assertThat(foundRating.prompt).isNotNull
        assertThat(foundRating.user).isNotNull
        assertThat(foundRating.prompt.id).isEqualTo(prompt1.id)
        assertThat(foundRating.user.id).isEqualTo(user1.id)
    }
}