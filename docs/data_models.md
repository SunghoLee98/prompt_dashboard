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
  ├─────── (*) PromptRating
  |                    |
  ├─────── (*) BookmarkFolder
  |                    |
  ├─────── (*) PromptBookmark ─── (*) BookmarkFolder
  |                    |
  ├─────── (*) UserFollow (follower)
  |                    |
  ├─────── (*) UserFollow (following)
  |                    |
  └─────── (*) Notification
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
| bookmark_count | INTEGER | NOT NULL, DEFAULT 0 | Number of bookmarks |
| is_public | BOOLEAN | NOT NULL, DEFAULT true | Visibility status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_prompts_author_id` ON author_id
- `idx_prompts_category` ON category
- `idx_prompts_created_at` ON created_at DESC
- `idx_prompts_like_count` ON like_count DESC
- `idx_prompts_average_rating` ON average_rating DESC
- `idx_prompts_bookmark_count` ON bookmark_count DESC
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

    @Column(name = "bookmark_count", nullable = false)
    val bookmarkCount: Int = 0,

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
- Like count, average rating, rating count, and bookmark count are denormalized for performance
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
- Like count, average rating, rating count, and bookmark count are denormalized in prompts table for faster queries
- Average rating is calculated and updated when ratings are added, updated, or deleted
- Bookmark counts are maintained by database triggers for consistency
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

### 6. bookmark_folders
User-created folders for organizing bookmarks.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing folder ID |
| user_id | BIGINT | NOT NULL, FK(users.id) | Folder owner |
| name | VARCHAR(50) | NOT NULL | Folder name |
| description | VARCHAR(200) | NULL | Optional description |
| bookmark_count | INTEGER | NOT NULL, DEFAULT 0 | Denormalized bookmark count |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_bookmark_folders_user_id` ON user_id
- `idx_bookmark_folders_user_name` ON (user_id, name) UNIQUE

**Constraints:**
- `fk_bookmark_folders_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `ck_bookmark_folders_name_length` CHECK (char_length(name) >= 3 AND char_length(name) <= 50)
- `ck_bookmark_folders_desc_length` CHECK (char_length(description) <= 200)

### 7. prompt_bookmarks
User bookmarks for prompts with optional folder organization.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing bookmark ID |
| user_id | BIGINT | NOT NULL, FK(users.id) | User who bookmarked |
| prompt_id | BIGINT | NOT NULL, FK(prompts.id) | Bookmarked prompt |
| folder_id | BIGINT | NULL, FK(bookmark_folders.id) | Optional folder assignment |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Bookmark creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_prompt_bookmarks_user_prompt` ON (user_id, prompt_id) UNIQUE
- `idx_prompt_bookmarks_user_id` ON user_id
- `idx_prompt_bookmarks_prompt_id` ON prompt_id
- `idx_prompt_bookmarks_folder_id` ON folder_id
- `idx_prompt_bookmarks_created_at` ON created_at DESC

**Constraints:**
- `fk_prompt_bookmarks_user` FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- `fk_prompt_bookmarks_prompt` FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
- `fk_prompt_bookmarks_folder` FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE SET NULL

## JPA Entity Models

### BookmarkFolder Entity

```kotlin
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
)

@Table("bookmark_folders")
class BookmarkFolders(id: Column<Long>) : LongIdTable(id) {
    val userId = reference("user_id", Users)
    val name = varchar("name", 50)
    val description = varchar("description", 200).nullable()
    val bookmarkCount = integer("bookmark_count").default(0)
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")

    init {
        uniqueIndex(userId, name)
        index(userId)
    }
}
```

### PromptBookmark Entity

```kotlin
@Entity
@Table(
    name = "prompt_bookmarks",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "prompt_id"])]
)
@EntityListeners(AuditingEntityListener::class)
data class PromptBookmark(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prompt_id", nullable = false)
    val prompt: Prompt,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    val folder: BookmarkFolder? = null,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Table("prompt_bookmarks")
class PromptBookmarks(id: Column<Long>) : LongIdTable(id) {
    val userId = reference("user_id", Users)
    val promptId = reference("prompt_id", Prompts)
    val folderId = reference("folder_id", BookmarkFolders).nullable()
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")

    init {
        uniqueIndex(userId, promptId)
        index(userId)
        index(promptId)
        index(folderId)
        index(createdAt)
    }
}
```

## Migration V6: Add Bookmark System

```sql
-- V6__add_bookmark_system.sql

-- Create bookmark folders table
CREATE TABLE bookmark_folders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    bookmark_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bookmark_folders_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ck_bookmark_folders_name_length
        CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
    CONSTRAINT ck_bookmark_folders_desc_length
        CHECK (char_length(description) <= 200)
);

-- Create prompt bookmarks table
CREATE TABLE prompt_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    prompt_id BIGINT NOT NULL,
    folder_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_prompt_bookmarks_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_prompt_bookmarks_prompt
        FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    CONSTRAINT fk_prompt_bookmarks_folder
        FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE SET NULL
);

-- Add bookmark_count to prompts table
ALTER TABLE prompts
ADD COLUMN bookmark_count INTEGER NOT NULL DEFAULT 0;

-- Create indexes for bookmark folders
CREATE INDEX idx_bookmark_folders_user_id ON bookmark_folders(user_id);
CREATE UNIQUE INDEX idx_bookmark_folders_user_name ON bookmark_folders(user_id, name);

-- Create indexes for prompt bookmarks
CREATE UNIQUE INDEX idx_prompt_bookmarks_user_prompt ON prompt_bookmarks(user_id, prompt_id);
CREATE INDEX idx_prompt_bookmarks_user_id ON prompt_bookmarks(user_id);
CREATE INDEX idx_prompt_bookmarks_prompt_id ON prompt_bookmarks(prompt_id);
CREATE INDEX idx_prompt_bookmarks_folder_id ON prompt_bookmarks(folder_id);
CREATE INDEX idx_prompt_bookmarks_created_at ON prompt_bookmarks(created_at DESC);

-- Create index for bookmark_count in prompts
CREATE INDEX idx_prompts_bookmark_count ON prompts(bookmark_count DESC);

-- Update triggers for maintaining denormalized counts
CREATE OR REPLACE FUNCTION update_bookmark_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update prompt bookmark count
        UPDATE prompts
        SET bookmark_count = bookmark_count + 1
        WHERE id = NEW.prompt_id;

        -- Update folder bookmark count if folder is assigned
        IF NEW.folder_id IS NOT NULL THEN
            UPDATE bookmark_folders
            SET bookmark_count = bookmark_count + 1
            WHERE id = NEW.folder_id;
        END IF;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update prompt bookmark count
        UPDATE prompts
        SET bookmark_count = bookmark_count - 1
        WHERE id = OLD.prompt_id;

        -- Update folder bookmark count if folder was assigned
        IF OLD.folder_id IS NOT NULL THEN
            UPDATE bookmark_folders
            SET bookmark_count = bookmark_count - 1
            WHERE id = OLD.folder_id;
        END IF;

        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle folder change
        IF OLD.folder_id IS DISTINCT FROM NEW.folder_id THEN
            -- Decrease count from old folder
            IF OLD.folder_id IS NOT NULL THEN
                UPDATE bookmark_folders
                SET bookmark_count = bookmark_count - 1
                WHERE id = OLD.folder_id;
            END IF;

            -- Increase count for new folder
            IF NEW.folder_id IS NOT NULL THEN
                UPDATE bookmark_folders
                SET bookmark_count = bookmark_count + 1
                WHERE id = NEW.folder_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trg_update_bookmark_counts
AFTER INSERT OR UPDATE OR DELETE ON prompt_bookmarks
FOR EACH ROW EXECUTE FUNCTION update_bookmark_counts();
```

### 8. user_follows
User-to-user follow relationships.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing follow ID |
| follower_id | BIGINT | NOT NULL, FK(users.id) | User who is following |
| following_id | BIGINT | NOT NULL, FK(users.id) | User being followed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Follow timestamp |

**Indexes:**
- `idx_user_follows_follower_following` ON (follower_id, following_id) UNIQUE
- `idx_user_follows_follower_id` ON follower_id
- `idx_user_follows_following_id` ON following_id
- `idx_user_follows_created_at` ON created_at DESC

**Constraints:**
- `fk_user_follows_follower` FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE
- `fk_user_follows_following` FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
- `ck_user_follows_no_self_follow` CHECK (follower_id != following_id)

### 9. notifications
Notification system for user activities.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Auto-incrementing notification ID |
| recipient_id | BIGINT | NOT NULL, FK(users.id) | User receiving the notification |
| sender_id | BIGINT | NULL, FK(users.id) | User triggering the notification |
| type | VARCHAR(50) | NOT NULL | Notification type (NEW_PROMPT_FROM_FOLLOWED, USER_FOLLOWED, etc.) |
| entity_type | VARCHAR(50) | NULL | Related entity type (PROMPT, USER, etc.) |
| entity_id | BIGINT | NULL | Related entity ID |
| title | VARCHAR(200) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| is_read | BOOLEAN | NOT NULL, DEFAULT false | Read status |
| read_at | TIMESTAMP | NULL | When the notification was read |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_notifications_recipient_id` ON recipient_id
- `idx_notifications_recipient_unread` ON recipient_id WHERE is_read = false
- `idx_notifications_created_at` ON created_at DESC
- `idx_notifications_type` ON type

**Constraints:**
- `fk_notifications_recipient` FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
- `fk_notifications_sender` FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE

## User Follow System JPA Entities

### UserFollow Entity
```kotlin
@Entity
@Table(
    name = "user_follows",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["follower_id", "following_id"])
    ]
)
@EntityListeners(AuditingEntityListener::class)
data class UserFollow(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    val follower: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    val following: User,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
```

### Notification Entity
```kotlin
@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener::class)
data class Notification(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    val recipient: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    val sender: User? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val type: NotificationType,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", length = 50)
    val entityType: EntityType? = null,

    @Column(name = "entity_id")
    val entityId: Long? = null,

    @Column(nullable = false, length = 200)
    val title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val message: String,

    @Column(name = "is_read", nullable = false)
    var isRead: Boolean = false,

    @Column(name = "read_at")
    var readAt: LocalDateTime? = null,

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class NotificationType {
    NEW_PROMPT_FROM_FOLLOWED,
    USER_FOLLOWED,
    PROMPT_LIKED,
    PROMPT_RATED,
    PROMPT_BOOKMARKED,
    SYSTEM_ANNOUNCEMENT
}

enum class EntityType {
    PROMPT,
    USER,
    RATING,
    BOOKMARK
}
```

### Updated User Entity (with follow counts)
```kotlin
@Entity
@Table(name = "users")
data class User(
    // ... existing fields ...

    @Column(name = "follower_count", nullable = false)
    val followerCount: Int = 0,

    @Column(name = "following_count", nullable = false)
    val followingCount: Int = 0,

    // ... rest of the entity ...
)
```

## Migration V9: Add User Follow System

```sql
-- V9__add_user_follow_system.sql

-- Add follow counts to users table
ALTER TABLE users
ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN following_count INTEGER NOT NULL DEFAULT 0;

-- Create user_follows table
CREATE TABLE user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL,
    following_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_follows_follower
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_follows_following
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ck_user_follows_no_self_follow
        CHECK (follower_id != following_id)
);

-- Create notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    sender_id BIGINT,
    type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_recipient
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_sender
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for user_follows
CREATE UNIQUE INDEX idx_user_follows_follower_following ON user_follows(follower_id, following_id);
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);

-- Create indexes for notifications
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create indexes for follow counts
CREATE INDEX idx_users_follower_count ON users(follower_count DESC);
CREATE INDEX idx_users_following_count ON users(following_count DESC);

-- Function to update follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update follower count for the followed user
        UPDATE users
        SET follower_count = follower_count + 1
        WHERE id = NEW.following_id;

        -- Update following count for the follower
        UPDATE users
        SET following_count = following_count + 1
        WHERE id = NEW.follower_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update follower count for the unfollowed user
        UPDATE users
        SET follower_count = follower_count - 1
        WHERE id = OLD.following_id;

        -- Update following count for the unfollower
        UPDATE users
        SET following_count = following_count - 1
        WHERE id = OLD.follower_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow counts
CREATE TRIGGER trg_update_follow_counts
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Function to create notification for new prompts from followed users
CREATE OR REPLACE FUNCTION notify_followers_on_new_prompt()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notifications for all followers of the prompt author
    INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id, title, message)
    SELECT
        uf.follower_id,
        NEW.author_id,
        'NEW_PROMPT_FROM_FOLLOWED',
        'PROMPT',
        NEW.id,
        'New prompt from ' || u.nickname,
        u.nickname || ' published a new prompt: ' || NEW.title
    FROM user_follows uf
    JOIN users u ON u.id = NEW.author_id
    WHERE uf.following_id = NEW.author_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new prompt notifications
CREATE TRIGGER trg_notify_followers_on_new_prompt
AFTER INSERT ON prompts
FOR EACH ROW EXECUTE FUNCTION notify_followers_on_new_prompt();
```