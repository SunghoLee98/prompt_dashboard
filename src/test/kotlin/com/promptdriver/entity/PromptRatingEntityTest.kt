package com.promptdriver.entity

import jakarta.persistence.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

class PromptRatingEntityTest {

    private lateinit var user: User
    private lateinit var author: User
    private lateinit var prompt: Prompt

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
    }

    @ParameterizedTest
    @ValueSource(ints = [1, 2, 3, 4, 5])
    fun `should create PromptRating with valid rating values`(rating: Int) {
        // When
        val promptRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = rating
        )

        // Then
        assertThat(promptRating).isNotNull
        assertThat(promptRating.prompt).isEqualTo(prompt)
        assertThat(promptRating.user).isEqualTo(user)
        assertThat(promptRating.rating).isEqualTo(rating)
        assertThat(promptRating.id).isEqualTo(0L) // default value
        assertThat(promptRating.createdAt).isNotNull
        assertThat(promptRating.updatedAt).isNotNull
    }

    @ParameterizedTest
    @ValueSource(ints = [0, -1, -5, 6, 10, 100])
    fun `should throw exception when creating PromptRating with invalid rating values`(rating: Int) {
        // When & Then
        val exception = assertThrows<IllegalArgumentException> {
            PromptRating(
                prompt = prompt,
                user = user,
                rating = rating
            )
        }
        assertThat(exception.message).isEqualTo("Rating must be between 1 and 5")
    }

    @Test
    fun `should create PromptRating with all fields`() {
        // Given
        val id = 100L
        val createdAt = LocalDateTime.now().minusDays(1)
        val updatedAt = LocalDateTime.now()

        // When
        val promptRating = PromptRating(
            id = id,
            prompt = prompt,
            user = user,
            rating = 4,
            createdAt = createdAt,
            updatedAt = updatedAt
        )

        // Then
        assertThat(promptRating.id).isEqualTo(id)
        assertThat(promptRating.prompt).isEqualTo(prompt)
        assertThat(promptRating.user).isEqualTo(user)
        assertThat(promptRating.rating).isEqualTo(4)
        assertThat(promptRating.createdAt).isEqualTo(createdAt)
        assertThat(promptRating.updatedAt).isEqualTo(updatedAt)
    }

    @ParameterizedTest
    @ValueSource(ints = [1, 2, 3, 4, 5])
    fun `should update rating with valid values`(newRating: Int) {
        // Given
        val promptRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3
        )

        // When
        promptRating.updateRating(newRating)

        // Then
        assertThat(promptRating.rating).isEqualTo(newRating)
    }

    @ParameterizedTest
    @ValueSource(ints = [0, -1, -10, 6, 10, 100])
    fun `should throw exception when updating rating with invalid values`(newRating: Int) {
        // Given
        val promptRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3
        )

        // When & Then
        val exception = assertThrows<IllegalArgumentException> {
            promptRating.updateRating(newRating)
        }
        assertThat(exception.message).isEqualTo("Rating must be between 1 and 5")
        assertThat(promptRating.rating).isEqualTo(3) // rating should not change
    }

    @Test
    fun `should test equals method with same object`() {
        // Given
        val promptRating = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )

        // When & Then
        assertThat(promptRating).isEqualTo(promptRating)
    }

    @Test
    fun `should test equals method with same id`() {
        // Given
        val promptRating1 = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )
        val promptRating2 = PromptRating(
            id = 1L,
            prompt = prompt,
            user = author, // different user
            rating = 3 // different rating
        )

        // When & Then
        assertThat(promptRating1).isEqualTo(promptRating2)
    }

    @Test
    fun `should test equals method with different id`() {
        // Given
        val promptRating1 = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )
        val promptRating2 = PromptRating(
            id = 2L,
            prompt = prompt,
            user = user,
            rating = 5
        )

        // When & Then
        assertThat(promptRating1).isNotEqualTo(promptRating2)
    }

    @Test
    fun `should test equals method with null`() {
        // Given
        val promptRating = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )

        // When & Then
        assertThat(promptRating).isNotEqualTo(null)
    }

    @Test
    fun `should test equals method with different class`() {
        // Given
        val promptRating = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )
        val otherObject = "This is a string"

        // When & Then
        assertThat(promptRating).isNotEqualTo(otherObject)
    }

    @Test
    fun `should test hashCode method`() {
        // Given
        val promptRating1 = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )
        val promptRating2 = PromptRating(
            id = 1L,
            prompt = prompt,
            user = author,
            rating = 3
        )
        val promptRating3 = PromptRating(
            id = 2L,
            prompt = prompt,
            user = user,
            rating = 5
        )

        // When & Then
        assertThat(promptRating1.hashCode()).isEqualTo(promptRating2.hashCode())
        assertThat(promptRating1.hashCode()).isNotEqualTo(promptRating3.hashCode())
    }

    @Test
    fun `should test hashCode with default id`() {
        // Given
        val promptRating1 = PromptRating(
            prompt = prompt,
            user = user,
            rating = 5
        )
        val promptRating2 = PromptRating(
            prompt = prompt,
            user = author,
            rating = 3
        )

        // When & Then
        assertThat(promptRating1.hashCode()).isEqualTo(promptRating2.hashCode())
        assertThat(promptRating1.hashCode()).isEqualTo(0L.hashCode())
    }

    @Test
    fun `should maintain immutability of id field`() {
        // Given
        val promptRating = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5
        )

        // Then - id is val, so it cannot be changed
        assertThat(promptRating.id).isEqualTo(1L)
        // The following line would not compile:
        // promptRating.id = 2L
    }

    @Test
    fun `should allow mutation of rating field`() {
        // Given
        val promptRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3
        )

        // When
        promptRating.rating = 5

        // Then
        assertThat(promptRating.rating).isEqualTo(5)
    }

    @Test
    fun `should allow mutation of timestamp fields`() {
        // Given
        val promptRating = PromptRating(
            prompt = prompt,
            user = user,
            rating = 3
        )
        val newCreatedAt = LocalDateTime.now().minusDays(10)
        val newUpdatedAt = LocalDateTime.now()

        // When
        promptRating.createdAt = newCreatedAt
        promptRating.updatedAt = newUpdatedAt

        // Then
        assertThat(promptRating.createdAt).isEqualTo(newCreatedAt)
        assertThat(promptRating.updatedAt).isEqualTo(newUpdatedAt)
    }

    @Test
    fun `should have proper JPA annotations`() {
        // Given
        val clazz = PromptRating::class.java

        // Then - Check class-level annotations
        assertThat(clazz.isAnnotationPresent(Entity::class.java)).isTrue
        assertThat(clazz.isAnnotationPresent(Table::class.java)).isTrue
        assertThat(clazz.isAnnotationPresent(EntityListeners::class.java)).isTrue

        // Check table annotation details
        val tableAnnotation = clazz.getAnnotation(Table::class.java)
        assertThat(tableAnnotation.name).isEqualTo("prompt_ratings")
        assertThat(tableAnnotation.uniqueConstraints).hasSize(1)
        
        val uniqueConstraint = tableAnnotation.uniqueConstraints[0]
        assertThat(uniqueConstraint.columnNames).containsExactlyInAnyOrder("user_id", "prompt_id")
    }

    @Test
    fun `should have proper field annotations`() {
        // Given
        val clazz = PromptRating::class.java

        // Then - Check id field
        val idField = clazz.getDeclaredField("id")
        assertThat(idField.isAnnotationPresent(Id::class.java)).isTrue
        assertThat(idField.isAnnotationPresent(GeneratedValue::class.java)).isTrue

        // Check prompt field
        val promptField = clazz.getDeclaredField("prompt")
        assertThat(promptField.isAnnotationPresent(ManyToOne::class.java)).isTrue
        assertThat(promptField.isAnnotationPresent(JoinColumn::class.java)).isTrue
        
        val promptJoinColumn = promptField.getAnnotation(JoinColumn::class.java)
        assertThat(promptJoinColumn.name).isEqualTo("prompt_id")
        assertThat(promptJoinColumn.nullable).isFalse

        // Check user field
        val userField = clazz.getDeclaredField("user")
        assertThat(userField.isAnnotationPresent(ManyToOne::class.java)).isTrue
        assertThat(userField.isAnnotationPresent(JoinColumn::class.java)).isTrue
        
        val userJoinColumn = userField.getAnnotation(JoinColumn::class.java)
        assertThat(userJoinColumn.name).isEqualTo("user_id")
        assertThat(userJoinColumn.nullable).isFalse

        // Check rating field
        val ratingField = clazz.getDeclaredField("rating")
        assertThat(ratingField.isAnnotationPresent(Column::class.java)).isTrue
        
        val ratingColumn = ratingField.getAnnotation(Column::class.java)
        assertThat(ratingColumn.nullable).isFalse

        // Check timestamp fields
        val createdAtField = clazz.getDeclaredField("createdAt")
        assertThat(createdAtField.isAnnotationPresent(CreatedDate::class.java)).isTrue
        assertThat(createdAtField.isAnnotationPresent(Column::class.java)).isTrue

        val updatedAtField = clazz.getDeclaredField("updatedAt")
        assertThat(updatedAtField.isAnnotationPresent(LastModifiedDate::class.java)).isTrue
        assertThat(updatedAtField.isAnnotationPresent(Column::class.java)).isTrue
    }

    @Test
    fun `should test data class copy functionality`() {
        // Given
        val original = PromptRating(
            id = 1L,
            prompt = prompt,
            user = user,
            rating = 5,
            createdAt = LocalDateTime.now().minusDays(1),
            updatedAt = LocalDateTime.now()
        )

        // When
        val copy = original.copy(rating = 3)

        // Then
        assertThat(copy).isNotSameAs(original)
        assertThat(copy.id).isEqualTo(original.id)
        assertThat(copy.prompt).isEqualTo(original.prompt)
        assertThat(copy.user).isEqualTo(original.user)
        assertThat(copy.rating).isEqualTo(3)
        assertThat(copy.createdAt).isEqualTo(original.createdAt)
        assertThat(copy.updatedAt).isEqualTo(original.updatedAt)
    }

    @Test
    fun `should test toString method`() {
        // Given
        val promptRating = PromptRating(
            id = 123L,
            prompt = prompt,
            user = user,
            rating = 4
        )

        // When
        val stringRepresentation = promptRating.toString()

        // Then
        assertThat(stringRepresentation).contains("PromptRating")
        assertThat(stringRepresentation).contains("id=123")
        assertThat(stringRepresentation).contains("rating=4")
    }
}