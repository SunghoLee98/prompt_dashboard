# User Follow System Architecture

## Overview
The User Follow System enables social interactions within the Prompt Driver platform, allowing users to follow other users, receive notifications about their activities, and discover new content through personalized feeds.

## System Components

### 1. Core Features

#### User Following
- **Follow/Unfollow Actions**: Users can follow or unfollow other users
- **Self-Follow Prevention**: System prevents users from following themselves
- **Bidirectional Relationships**: Track both followers and following lists
- **Follow Status Checks**: Real-time status verification between users
- **Follow Count Management**: Denormalized counters for performance

#### Notification System
- **Activity Notifications**: Real-time notifications for user activities
- **Notification Types**:
  - NEW_PROMPT_FROM_FOLLOWED: When followed users publish new prompts
  - USER_FOLLOWED: When someone follows the user
  - PROMPT_LIKED: When user's prompt is liked
  - PROMPT_RATED: When user's prompt is rated
  - PROMPT_BOOKMARKED: When user's prompt is bookmarked
  - SYSTEM_ANNOUNCEMENT: Platform-wide announcements
- **Read Status Management**: Track read/unread states
- **Batch Operations**: Mark all as read functionality
- **User Preferences**: Configurable notification settings

#### Feed System
- **Personalized Feed**: Aggregated content from followed users
- **Chronological Ordering**: Latest content first
- **Pagination Support**: Efficient loading of large feeds
- **Content Filtering**: Based on user preferences and activity

### 2. Database Design

#### Tables Structure

```sql
-- User Follows Table
CREATE TABLE user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id),
    following_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Notifications Table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    sender_id BIGINT REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User Table Extensions
ALTER TABLE users ADD COLUMN follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;
```

#### Indexes for Performance

```sql
-- Follow Indexes
CREATE UNIQUE INDEX idx_user_follows_unique ON user_follows(follower_id, following_id);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created ON user_follows(created_at DESC);

-- Notification Indexes
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- User Count Indexes
CREATE INDEX idx_users_follower_count ON users(follower_count DESC);
CREATE INDEX idx_users_following_count ON users(following_count DESC);
```

#### Database Triggers

```sql
-- Follow Count Maintenance Trigger
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET follower_count = follower_count + 1
        WHERE id = NEW.following_id;
        UPDATE users SET following_count = following_count + 1
        WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET follower_count = follower_count - 1
        WHERE id = OLD.following_id;
        UPDATE users SET following_count = following_count - 1
        WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Notification Creation Trigger
CREATE OR REPLACE FUNCTION notify_followers_on_new_prompt()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (recipient_id, sender_id, type, entity_type, entity_id, title, message)
    SELECT
        uf.follower_id,
        NEW.author_id,
        'NEW_PROMPT_FROM_FOLLOWED',
        'PROMPT',
        NEW.id,
        'New prompt from ' || u.nickname,
        u.nickname || ' published: ' || NEW.title
    FROM user_follows uf
    JOIN users u ON u.id = NEW.author_id
    WHERE uf.following_id = NEW.author_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. API Design

#### Follow Management Endpoints
- `POST /api/users/{userId}/follow` - Follow a user
- `DELETE /api/users/{userId}/follow` - Unfollow a user
- `GET /api/users/{userId}/followers` - Get user's followers
- `GET /api/users/{userId}/following` - Get user's following list
- `GET /api/users/{userId}/follow/status` - Check follow relationship
- `GET /api/users/me/feed` - Get personalized feed

#### Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/users/me/notification-settings` - Update preferences

### 4. Security Considerations

#### Access Control
- **Authentication Required**: All follow actions require authentication
- **Authorization Checks**: Users can only manage their own follows
- **Privacy Controls**: Configurable profile visibility settings
- **Rate Limiting**: Prevent follow/unfollow spam

#### Data Validation
- **Self-Follow Prevention**: Database constraint and application logic
- **Duplicate Prevention**: Unique constraint on follow relationships
- **Input Sanitization**: All notification content sanitized
- **Cascade Deletion**: Proper cleanup when users are deleted

#### Security Measures
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: HTML sanitization for notifications
- **CSRF Protection**: Token-based validation
- **Audit Logging**: Track follow/unfollow activities

### 5. Performance Optimization Strategies

#### Caching Strategy
```yaml
Cache Layers:
  L1 - Application Cache:
    - Follow relationships (5 min TTL)
    - Notification counts (1 min TTL)
    - User feed pages (2 min TTL)

  L2 - Redis Cache:
    - Follow status checks
    - Frequently accessed user profiles
    - Hot feed content

  L3 - Database Query Cache:
    - Common aggregation queries
    - Follower/following counts
```

#### Query Optimization
- **Denormalized Counts**: Maintain follower/following counts in users table
- **Efficient Joins**: Use indexed columns for relationship queries
- **Pagination**: Cursor-based pagination for large lists
- **Batch Loading**: Fetch related data in bulk
- **Query Result Caching**: Cache expensive aggregation queries

#### Scalability Patterns
- **Read Replicas**: Distribute read load for follow queries
- **Sharding Strategy**: Shard by user_id for horizontal scaling
- **Async Processing**: Queue notification creation
- **Connection Pooling**: Optimize database connections
- **CDN Integration**: Cache user profile images

### 6. Notification System Architecture

#### Real-time Delivery Options
```yaml
WebSocket Implementation:
  - Server: Spring WebSocket with STOMP
  - Client: SockJS with auto-reconnect
  - Channels: /user/queue/notifications
  - Heartbeat: 25 seconds

Server-Sent Events (SSE):
  - Endpoint: /api/notifications/stream
  - Retry: Automatic with exponential backoff
  - Compression: Gzip enabled

Long Polling Fallback:
  - Endpoint: /api/notifications/poll
  - Timeout: 30 seconds
  - Interval: 5 seconds minimum
```

#### Notification Queue System
```yaml
Queue Architecture:
  Producer:
    - Event triggers (follow, prompt, like, etc.)
    - Batch creation for efficiency

  Queue:
    - Technology: RabbitMQ or Redis Pub/Sub
    - Channels: By notification type
    - Priority: System > User activity

  Consumer:
    - Parallel processing workers
    - Retry mechanism with DLQ
    - Rate limiting per user
```

### 7. Feed Generation Strategy

#### Feed Algorithm
```python
def generate_user_feed(user_id, page, size):
    # Get followed users
    followed_users = get_following_list(user_id)

    # Fetch recent prompts from followed users
    prompts = query("""
        SELECT p.* FROM prompts p
        WHERE p.author_id IN :followed_users
        AND p.is_public = true
        AND p.created_at > :cutoff_date
        ORDER BY p.created_at DESC
        LIMIT :size OFFSET :offset
    """, {
        followed_users: followed_users,
        cutoff_date: now() - 30.days,
        size: size,
        offset: page * size
    })

    # Enrich with user engagement data
    enrich_with_engagement_data(prompts, user_id)

    return prompts
```

#### Feed Caching Strategy
- **User-Level Cache**: Cache individual user feeds
- **Segment Cache**: Cache popular content segments
- **Incremental Updates**: Append new content to cached feeds
- **Cache Invalidation**: On new prompt or follow change

### 8. System Integration

#### Integration with Existing Systems
```yaml
Prompt System:
  - Trigger notifications on new prompts
  - Include follow status in prompt responses
  - Filter feed based on prompt visibility

Rating System:
  - Notify on new ratings with comments
  - Show ratings from followed users first

Bookmark System:
  - Notify when prompts are bookmarked
  - Suggest bookmarks from followed users

Search System:
  - Boost content from followed users
  - Filter by followed users option
```

#### Event-Driven Architecture
```yaml
Events:
  UserFollowed:
    - Update follow counts
    - Create notification
    - Update feed cache

  PromptPublished:
    - Notify followers
    - Update user feeds
    - Trigger recommendations

  UserUnfollowed:
    - Update counts
    - Remove from feed
    - Clean up notifications
```

### 9. Monitoring & Analytics

#### Key Metrics
```yaml
User Engagement:
  - Daily/Monthly Active Followers
  - Follow/Unfollow Rate
  - Average Followers per User
  - Feed Engagement Rate

System Performance:
  - Notification Delivery Time
  - Feed Generation Time
  - Database Query Performance
  - Cache Hit Ratio

Business Metrics:
  - User Retention by Follow Count
  - Content Discovery Rate
  - Viral Coefficient
  - Network Growth Rate
```

#### Monitoring Implementation
```yaml
Application Metrics:
  - Micrometer with Prometheus
  - Custom metrics for business KPIs

Database Monitoring:
  - Query performance tracking
  - Connection pool metrics
  - Slow query logging

Infrastructure:
  - Spring Boot Actuator
  - Health checks for dependencies
  - Alert rules for anomalies
```

### 10. Migration Strategy

#### Phase 1: Core Following System
- Implement follow/unfollow functionality
- Add follower/following lists
- Deploy database migrations

#### Phase 2: Basic Notifications
- Add notification creation for follows
- Implement notification management APIs
- Create notification UI components

#### Phase 3: Feed System
- Implement personalized feed generation
- Add feed caching layer
- Optimize query performance

#### Phase 4: Real-time Features
- Add WebSocket support
- Implement real-time notifications
- Add presence indicators

#### Phase 5: Advanced Features
- Recommendation system
- Trending users discovery
- Social graph analytics

### 11. Testing Strategy

#### Unit Tests
```kotlin
@Test
fun `should not allow self-follow`() {
    val userId = 1L
    assertThrows<BusinessException> {
        followService.followUser(userId, userId)
    }
}

@Test
fun `should update follow counts on follow`() {
    val follower = createUser()
    val following = createUser()

    followService.followUser(follower.id, following.id)

    val updatedFollower = userRepository.findById(follower.id)
    val updatedFollowing = userRepository.findById(following.id)

    assertEquals(1, updatedFollower.followingCount)
    assertEquals(1, updatedFollowing.followerCount)
}
```

#### Integration Tests
- Test notification creation triggers
- Verify feed generation with multiple users
- Test pagination and sorting
- Verify cache invalidation

#### Performance Tests
- Load test follow/unfollow operations
- Stress test notification system
- Benchmark feed generation
- Test cache effectiveness

### 12. Future Enhancements

#### Planned Features
- **Mutual Follow Detection**: Special status for mutual follows
- **Follow Suggestions**: ML-based user recommendations
- **Follow Categories**: Organize follows into lists
- **Private Profiles**: Request-based follow system
- **Influencer Features**: Verified badges, analytics
- **Follow History**: Track follow/unfollow timeline
- **Batch Follow**: Import from other platforms
- **Export Functionality**: Download follower lists

#### Technical Improvements
- **GraphQL API**: Flexible data fetching
- **Event Sourcing**: Complete follow history
- **Graph Database**: Neo4j for relationship queries
- **ML Pipeline**: Recommendation engine
- **Real-time Sync**: WebRTC for instant updates