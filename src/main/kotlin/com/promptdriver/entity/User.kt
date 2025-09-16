package com.promptdriver.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener::class)
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(unique = true, nullable = false)
    var email: String,
    
    @Column(nullable = false)
    var password: String,
    
    @Column(unique = true, nullable = false, length = 30)
    var nickname: String,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val role: UserRole = UserRole.USER,
    
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
    
    @OneToMany(mappedBy = "author", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val prompts: MutableList<Prompt> = mutableListOf(),
    
    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val likes: MutableSet<PromptLike> = mutableSetOf(),
    
    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val ratings: MutableSet<PromptRating> = mutableSetOf(),
    
    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val refreshTokens: MutableSet<RefreshToken> = mutableSetOf(),

    @Column(name = "follower_count", nullable = false)
    var followerCount: Int = 0,

    @Column(name = "following_count", nullable = false)
    var followingCount: Int = 0
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as User
        return id == other.id
    }

    override fun hashCode(): Int {
        return id.hashCode()
    }
}

enum class UserRole {
    USER, ADMIN
}