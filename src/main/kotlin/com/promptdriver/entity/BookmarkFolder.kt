package com.promptdriver.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

@Entity
@Table(
    name = "bookmark_folders",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "name"])]
)
@EntityListeners(AuditingEntityListener::class)
data class BookmarkFolder(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false, length = 50)
    val name: String,

    @Column(length = 200)
    val description: String? = null,

    @Column(name = "bookmark_count", nullable = false)
    val bookmarkCount: Int = 0,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    override fun toString(): String {
        return "BookmarkFolder(id=$id, name='$name', description=$description, bookmarkCount=$bookmarkCount)"
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as BookmarkFolder

        return id == other.id
    }

    override fun hashCode(): Int {
        return id.hashCode()
    }
}