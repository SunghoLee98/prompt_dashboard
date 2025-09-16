# project introduction
- This project is for archiving and sharing knowledge about agent prompt.

# development workflow

1. architect agent: design API specifications, data models, and system architecture
- write result to 'docs/api_specifications.md', 'docs/data_models.md', 'docs/system_architecture.md'
- Any important decisions MUST be documented in CLAUDE.md
- All the main features MUST be written down in CLAUDE.md

2. developer agent: implement features based on the architect's designs
- MUST implement features according to the specifications in 'docs/api_specifications.md', 'docs/data_models.md', and 'docs/system_architecture.md'
- MUSH write test code for each feature and make sure all tests pass
- Every feature MUST be committed to the git repository with clear commit messages

3. frontend agent: design and implement the user interface
- Every feature MUST be committed to the git repository with clear commit messages
- MUST implement the frontend according to the API specifications in 'docs/api_specifications.md'

4. tester agent: write and execute test cases based on playwrite to ensure the quality of the code
- MUST write E2E tests for the entire system
- use directory 'tests/e2e' to store all the e2e test cases
- NEVER modify the implementation code, only write and run tests
- All the tests MUST pass before the project is considered complete

5. rotate roles and repeat steps 1-4 until the e2e tests pass

# environment

- backend: localhost:9090
- frontend: localhost:4000
- database: localhost:5432

# technical stack

- backend: spring boot with kotlin
- database: PostgreSQL
- frontend: React with TypeScript

# main features

## MVP Features (Phase 1)
1. **User Authentication System**
   - User registration with email, password, and nickname
   - JWT-based authentication (access token + refresh token)
   - Secure password storage with BCrypt
   - Session management with token refresh

2. **Prompt Management**
   - Create, read, update, delete prompts (CRUD)
   - Rich text content support (up to 10,000 characters)
   - Categorization system (8 predefined categories)
   - Tag system (up to 5 tags per prompt)
   - View count tracking
   - Like/unlike functionality
   - Rating system (1-5 stars, one rating per user per prompt)

3. **Search and Discovery**
   - Paginated prompt listing (20 items default, 100 max)
   - Full-text search in title, description, and content
   - Filter by category
   - Sort by date, popularity (likes), views, average rating
   - Tag-based filtering

4. **User Interface**
   - Responsive design for mobile and desktop
   - Material Design or Ant Design component library
   - Real-time form validation
   - Loading states and error handling
   - Session-based authentication UI

## Phase 3 Features - Rating Comment System
1. **Enhanced Rating System**
   - Optional comments with ratings (max 1,000 characters)
   - Public visibility of rating comments with user attribution
   - Chronological display of comments (newest first)
   - XSS protection through HTML sanitization
   - Edit/delete own rating comments

2. **API Enhancements**
   - Extended rating endpoints to support comments
   - Paginated comment retrieval (10 per page default)
   - Filter to show only ratings with comments
   - Dedicated endpoint for recent rating comments

3. **Data Model Updates**
   - Added comment field to prompt_ratings table
   - Database constraint for comment length
   - Indexes for efficient comment queries
   - Migration V5 for schema update

# key design decisions

## Architecture Decisions
1. **Three-Tier Architecture**: Clear separation between presentation (React), business logic (Spring Boot), and data (PostgreSQL)
2. **RESTful API Design**: Following REST conventions with proper HTTP methods and status codes
3. **JWT Authentication**: Stateless authentication with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
4. **Modular Project Structure**: Organized by feature/domain for better maintainability

## Database Design
1. **Normalized Schema**: Proper normalization with foreign key relationships
2. **Denormalized Counters**: Like count, average rating, and rating count stored in prompts table for performance
3. **Full-Text Search Index**: PostgreSQL full-text search on title, description, content
4. **Soft Delete Pattern**: Using is_active/is_public flags instead of hard deletes
5. **UTC Timestamps**: All times stored in UTC for consistency
6. **Rating System Design**: Separate ratings table with unique constraint on user_id + prompt_id

## Security Decisions
1. **BCrypt Password Hashing**: Industry standard with salt rounds = 10
2. **Role-Based Access Control**: USER and ADMIN roles with different permissions
3. **Resource-Based Authorization**: Users can only modify their own resources, cannot rate their own prompts
4. **Rate Limiting**: Protection against abuse (100 req/hour anonymous, 1000 req/hour authenticated)
5. **Input Validation**: Server-side validation for all inputs with specific rules

## Performance Optimizations
1. **Lazy Loading**: JPA lazy fetching for related entities
2. **Pagination**: Default 20 items per page to reduce load
3. **Database Indexing**: Indexes on frequently queried columns (email, nickname, created_at, category, average_rating)
4. **Response Caching**: Planned Redis integration for frequently accessed data
5. **Connection Pooling**: HikariCP for efficient database connections
6. **Denormalized Rating Aggregates**: Average rating and count cached in prompts table to avoid expensive JOINs

## Frontend Decisions
1. **Single Page Application**: React with client-side routing
2. **Redux Toolkit**: For predictable state management
3. **TypeScript**: Type safety and better developer experience
4. **React Hook Form**: Efficient form handling with built-in validation
5. **Axios**: Promise-based HTTP client with interceptors for auth

## Development Practices
1. **API-First Design**: API specifications defined before implementation
2. **Database Migrations**: Flyway for version-controlled schema changes
3. **Environment Configuration**: Separate configs for dev, staging, prod
4. **Comprehensive Testing**: Unit tests, integration tests, and E2E tests
5. **Docker Development**: Containerized development environment

## Rating System Design Decisions (Phase 2)
1. **Integer-Only Ratings**: 1-5 star rating system with integer values only for simplicity
2. **One Rating Per User**: Unique constraint on (user_id, prompt_id) ensures one rating per user per prompt
3. **Self-Rating Prevention**: Business logic prevents users from rating their own prompts
4. **Rating Update/Delete**: Users can modify or remove their ratings at any time
5. **Denormalized Aggregates**: Average rating and count stored in prompts table for query performance
6. **Real-time Calculation**: Average rating recalculated on every rating CRUD operation
7. **Database Triggers Option**: Consider PostgreSQL triggers for maintaining denormalized data consistency
8. **Decimal Precision**: Average rating stored as DECIMAL(3,2) for values like 4.75
9. **Null Average**: NULL average_rating when no ratings exist (not 0.0)
10. **Rating History**: Consider adding rating history table for analytics in future phases

## Rating Comment System Design Decisions (Phase 3)
1. **Optional Comments**: Comments are optional to maintain simplicity and encourage more ratings
2. **Character Limit**: 1,000 character limit balances expressiveness with database performance
3. **Public Visibility**: All comments are public to foster community engagement and transparency
4. **XSS Prevention**: HTML sanitization using OWASP Java HTML Sanitizer for security
5. **Chronological Display**: Newest comments first for better user engagement
6. **Single Comment Field**: Extended existing ratings table instead of separate comments table for simplicity
7. **Partial Index**: Index on comments WHERE comment IS NOT NULL for efficient filtered queries
8. **Pagination Default**: 10 comments per page to balance load time and user experience
9. **Comment Editing**: Users can edit their comments when updating their rating
10. **Null Handling**: Empty or whitespace-only comments stored as NULL to save space

## Rating Comment System (Phase 3)
**NEW FEATURE**: Enhanced rating system with user comments and review display

**Core Features**:
1. **Rating with Comments**: Users can add optional text comments when rating prompts (up to 1,000 characters)
2. **Comment Management**: Users can update or delete their own comments along with ratings
3. **Review Display**: Show all ratings with user names, star ratings, and comments in chronological order
4. **Comment Validation**: Server-side validation for appropriate content and length limits

**Technical Requirements**:
- Extend existing ratings table to include comment field (TEXT, nullable)
- API endpoints for CRUD operations on rating comments
- Frontend UI components for comment input and display
- Proper sanitization and XSS protection for user-generated content
- Pagination support for rating comments (10 per page default)

**Design Decisions**:
1. **Optional Comments**: Comments are optional - users can rate without commenting
2. **Comment Length Limit**: Maximum 1,000 characters to prevent abuse
3. **Public Visibility**: All comments are public and visible to all users
4. **Moderation Ready**: Architecture supports future moderation features
5. **Chronological Display**: Comments displayed in order of creation (newest first)
6. **User Attribution**: Comments show user nickname and creation timestamp
