package com.promptdriver.entity

import jakarta.persistence.*
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

@Entity
@Table(
    name = "prompt_ratings",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["user_id", "prompt_id"])
    ]
)
@EntityListeners(AuditingEntityListener::class)
data class PromptRating(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    val prompt: Prompt,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false)
    var rating: Int,

    @Column(columnDefinition = "TEXT")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    var comment: String? = null,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    init {
        require(rating in 1..5) { "Rating must be between 1 and 5" }
        // Normalize comment - treat empty or whitespace-only as null
        comment = comment?.trim()?.takeIf { it.isNotEmpty() }
    }

    fun updateRating(newRating: Int, newComment: String? = null) {
        require(newRating in 1..5) { "Rating must be between 1 and 5" }
        this.rating = newRating
        // Normalize comment - treat empty or whitespace-only as null
        this.comment = newComment?.trim()?.takeIf { it.isNotEmpty() }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as PromptRating
        return id == other.id
    }

    override fun hashCode(): Int {
        return id.hashCode()
    }
}