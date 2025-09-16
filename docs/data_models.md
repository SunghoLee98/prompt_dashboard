# Data Models

## Database Configuration
- Database: PostgreSQL 14+
- Schema: `prompt_driver`
- Timezone: UTC
- Character Encoding: UTF-8

## Entity Relationship Diagram

```
User (1) -------- (*) Prompt
  |                    |
  |                    |
  ├─────── (*) PromptLike
  |                    |
  └─────── (*) PromptRating
```

## Database Tables

### 1. users
Primary entity for user management.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing user ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password | VARCHAR(255) | NOT NULL | BCrypt encrypted password |
| nickname | VARCHAR(30) | UNIQUE, NOT NULL | Display name |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | User role (USER, ADMIN) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_users_email` ON email
- `idx_users_nickname` ON nickname
- `idx_users_created_at` ON created_at DESC

### 2. prompts
Core entity for prompt storage.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing prompt ID |
| title | VARCHAR(100) | NOT NULL | Prompt title |
| description | VARCHAR(300) | NOT NULL | Brief description |
| content | TEXT | NOT NULL | Full prompt content |
| category | VARCHAR(50) | NOT NULL | Prompt category |
| author_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to users.id |
| view_count | INTEGER | NOT NULL, DEFAULT 0 | Number of views |
| like_count | INTEGER | NOT NULL, DEFAULT 0 | Number of likes |
| average_rating | DECIMAL(3,2) | DEFAULT NULL | Average rating (1.00-5.00) |
| rating_count | INTEGER | NOT NULL, DEFAULT 0 | Number of ratings |
| is_public | BOOLEAN | NOT NULL, DEFAULT true | Visibility status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_prompts_author_id` ON author_id
- `idx_prompts_category` ON category
- `idx_prompts_created_at` ON created_at DESC
- `idx_prompts_like_count` ON like_count DESC
- `idx_prompts_average_rating` ON average_rating DESC
- `idx_prompts_full_text` ON title, description, content (Full Text Search)

**Foreign Keys:**
- `fk_prompts_author` FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE

### 3. prompt_tags
Many-to-many relationship for prompt tags.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| prompt_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to prompts.id |
| tag | VARCHAR(20) | NOT NULL | Tag name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes:**
- `idx_prompt_tags_prompt_id` ON prompt_id
- `idx_prompt_tags_tag` ON tag
- `uk_prompt_tags` UNIQUE (prompt_id, tag)

**Foreign Keys:**
- `fk_prompt_tags_prompt` FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE

### 4. prompt_likes
Tracks user likes on prompts.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| user_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to users.id |
| prompt_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to prompts.id |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Like timestamp |

**Indexes:**
- `uk_prompt_likes` UNIQUE (user_id, prompt_id)
- `idx_prompt_likes_prompt_id` ON prompt_id
- `idx_prompt_likes_user_id` ON user_id

**Foreign Keys:**
- `fk_prompt_likes_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `fk_prompt_likes_prompt` FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE

### 5. prompt_ratings
Tracks user ratings and optional comments on prompts.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| user_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to users.id |
| prompt_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to prompts.id |
| rating | SMALLINT | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | Rating value (1-5) |
| comment | TEXT | NULL, CHECK (char_length(comment) <= 1000) | Optional rating comment (max 1000 chars) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Rating creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- `uk_prompt_ratings` UNIQUE (user_id, prompt_id)
- `idx_prompt_ratings_prompt_id` ON prompt_id
- `idx_prompt_ratings_user_id` ON user_id
- `idx_prompt_ratings_rating` ON rating
- `idx_prompt_ratings_created_at` ON created_at DESC
- `idx_prompt_ratings_comment` ON prompt_id WHERE comment IS NOT NULL

**Foreign Keys:**
- `fk_prompt_ratings_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `fk_prompt_ratings_prompt` FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE

### 6. refresh_tokens
JWT refresh token storage.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| token | VARCHAR(500) | UNIQUE, NOT NULL | Refresh token value |
| user_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to users.id |
| expires_at | TIMESTAMP | NOT NULL | Token expiration time |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation time |

**Indexes:**
- `idx_refresh_tokens_token` ON token
- `idx_refresh_tokens_user_id` ON user_id
- `idx_refresh_tokens_expires_at` ON expires_at

**Foreign Keys:**
- `fk_refresh_tokens_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

## Kotlin Entity Classes

### User Entity
```kotlin
@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(unique = true, nullable = false)
    val email: String,
    
    @Column(nullable = false)
    val password: String,
    
    @Column(unique = true, nullable = false, length = 30)
    val nickname: String,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val role: UserRole = UserRole.USER,
    
    @Column(name = "is_active", nullable = false)
    val isActive: Boolean = true,
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),
    
    @OneToMany(mappedBy = "author", cascade = [CascadeType.ALL])
    val prompts: List<Prompt> = mutableListOf()
)

enum class UserRole {
    USER, ADMIN
}
```

### Prompt Entity
```kotlin
@Entity
@Table(name = "prompts")
data class Prompt(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(nullable = false, length = 100)
    val title: String,
    
    @Column(nullable = false, length = 300)
    val description: String,
    
    @Column(nullable = false, columnDefinition = "TEXT")
    val content: String,
    
    @Column(nullable = false, length = 50)
    val category: String,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    val author: User,
    
    @Column(name = "view_count", nullable = false)
    val viewCount: Int = 0,
    
    @Column(name = "like_count", nullable = false)
    val likeCount: Int = 0,
    
    @Column(name = "average_rating", precision = 3, scale = 2)
    val averageRating: BigDecimal? = null,
    
    @Column(name = "rating_count", nullable = false)
    val ratingCount: Int = 0,
    
    @Column(name = "is_public", nullable = false)
    val isPublic: Boolean = true,
    
    @ElementCollection
    @CollectionTable(
        name = "prompt_tags",
        joinColumns = [JoinColumn(name = "prompt_id")]
    )
    @Column(name = "tag")
    val tags: Set<String> = mutableSetOf(),
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
)
```

### PromptLike Entity
```kotlin
@Entity
@Table(
    name = "prompt_likes",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["user_id", "prompt_id"])
    ]
)
data class PromptLike(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    val prompt: Prompt,
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
```

### PromptRating Entity
```kotlin
@Entity
@Table(
    name = "prompt_ratings",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["user_id", "prompt_id"])
    ]
)
data class PromptRating(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    val prompt: Prompt,

    @Column(nullable = false)
    @Min(1)
    @Max(5)
    val rating: Int,

    @Column(columnDefinition = "TEXT")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    val comment: String? = null,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
)
```

### RefreshToken Entity
```kotlin
@Entity
@Table(name = "refresh_tokens")
data class RefreshToken(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    
    @Column(unique = true, nullable = false, length = 500)
    val token: String,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,
    
    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
```

## Data Constraints and Business Rules

### User Constraints
- Email must be unique and valid format
- Password must be at least 8 characters with mixed case and numbers
- Nickname must be unique, 2-30 characters, alphanumeric with underscores
- Users can only modify their own profile

### Prompt Constraints
- Title: 5-100 characters
- Description: 10-300 characters
- Content: 20-10000 characters
- Category must be from predefined list
- Maximum 5 tags per prompt
- Each tag: 2-20 characters
- Users can only edit/delete their own prompts
- View count increments on each unique view (session-based)
- Like count is denormalized for performance
- Average rating and rating count are denormalized for performance
- Users cannot rate their own prompts
- Rating values must be integers between 1 and 5 (inclusive)

### Rating Comment Constraints
- Comment is optional
- Maximum 1000 characters per comment
- HTML tags are sanitized to prevent XSS attacks
- Comments are public and visible to all users
- Users can edit/delete their own rating comments
- Comments are displayed chronologically (newest first)
- Empty or whitespace-only comments are treated as null

### Performance Considerations
- Like count, average rating, and rating count are denormalized in prompts table for faster queries
- Average rating is calculated and updated when ratings are added, updated, or deleted
- Full-text search index on title, description, and content
- Paginated queries with maximum 100 items per page
- Lazy loading for user and prompt relationships

## Predefined Categories
- `coding` - Programming and code snippets
- `writing` - Creative writing and content
- `analysis` - Data analysis and research
- `design` - Design and UI/UX
- `marketing` - Marketing and sales
- `education` - Teaching and learning
- `productivity` - Productivity and automation
- `other` - Miscellaneous

## Database Migration Strategy
1. Use Flyway for version control of database migrations
2. Initial migration creates all tables with indexes
3. Migration V4 adds rating system tables and columns
4. Migration V5 adds comment column to prompt_ratings table
5. Seed data includes predefined categories
6. All timestamps in UTC
7. Use database transactions for data consistency

## Migration V5: Add Rating Comments
```sql
-- V5__add_rating_comments.sql
ALTER TABLE prompt_ratings
ADD COLUMN comment TEXT NULL;

ALTER TABLE prompt_ratings
ADD CONSTRAINT check_comment_length
CHECK (char_length(comment) <= 1000);

CREATE INDEX idx_prompt_ratings_created_at
ON prompt_ratings(created_at DESC);

CREATE INDEX idx_prompt_ratings_comment
ON prompt_ratings(prompt_id)
WHERE comment IS NOT NULL;
```