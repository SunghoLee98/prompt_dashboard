package com.promptdriver.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

@Entity
@Table(name = "prompts")
@EntityListeners(AuditingEntityListener::class)
data class Prompt(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(nullable = false, length = 100)
    var title: String,
    
    @Column(nullable = false, length = 300)
    var description: String,
    
    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String,
    
    @Column(nullable = false, length = 50)
    var category: String,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    val author: User,
    
    @Column(name = "view_count", nullable = false)
    var viewCount: Int = 0,
    
    @Column(name = "like_count", nullable = false)
    var likeCount: Int = 0,
    
    @Column(name = "average_rating", nullable = true, columnDefinition = "DECIMAL(3,2)")
    var averageRating: Double? = null,
    
    @Column(name = "rating_count", nullable = false)
    var ratingCount: Int = 0,
    
    @Column(name = "is_public", nullable = false)
    var isPublic: Boolean = true,
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "prompt_tags",
        joinColumns = [JoinColumn(name = "prompt_id")]
    )
    @Column(name = "tag", length = 20)
    var tags: Set<String> = emptySet(),
    
    @OneToMany(mappedBy = "prompt", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val likes: MutableSet<PromptLike> = mutableSetOf(),
    
    @OneToMany(mappedBy = "prompt", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val ratings: MutableSet<PromptRating> = mutableSetOf(),
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun incrementViewCount() {
        this.viewCount++
    }
    
    fun incrementLikeCount() {
        this.likeCount++
    }
    
    fun decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--
        }
    }
    
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as Prompt
        return id == other.id
    }

    override fun hashCode(): Int {
        return id.hashCode()
    }
}