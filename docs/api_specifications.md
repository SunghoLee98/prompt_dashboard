# API Specifications

## Base URL
```
http://localhost:9090
```

## Authentication
All authenticated endpoints require JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

### JWT Token Configuration
- Access Token Expiration: 15 minutes (900000 ms)
- Refresh Token Expiration: 7 days (604800000 ms)
- Token Type: Bearer

## API Endpoints

### 1. Authentication APIs

#### 1.1 User Registration
**POST** `/api/auth/register`

Request Body:
```json
{
  "email": "string",
  "password": "string", 
  "nickname": "string"
}
```

Response (201 Created):
```json
{
  "id": "long",
  "email": "string",
  "nickname": "string",
  "createdAt": "datetime"
}
```

Error Responses:
- 400: Invalid input data
- 409: Email already exists

#### 1.2 User Login
**POST** `/api/auth/login`

Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response (200 OK):
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Error Responses:
- 401: Invalid credentials
- 404: User not found

#### 1.3 Token Refresh
**POST** `/api/auth/refresh`

Request Body:
```json
{
  "refreshToken": "string"
}
```

Response (200 OK):
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Error Responses:
- 401: Invalid or expired refresh token

#### 1.4 User Logout
**POST** `/api/auth/logout`
*Requires Authentication*

Response (204 No Content)

Error Responses:
- 401: Unauthorized

### 2. User APIs

#### 2.1 Get Current User Profile
**GET** `/api/users/me`
*Requires Authentication*

Response (200 OK):
```json
{
  "id": "long",
  "email": "string",
  "nickname": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

#### 2.2 Update User Profile
**PUT** `/api/users/me`
*Requires Authentication*

Request Body:
```json
{
  "nickname": "string"
}
```

Response (200 OK):
```json
{
  "id": "long",
  "email": "string",
  "nickname": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

#### 2.3 Get User by ID
**GET** `/api/users/{id}`

Response (200 OK):
```json
{
  "id": "long",
  "email": "string",
  "nickname": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Error Responses:
- 404: User not found

### 3. Prompt APIs

#### 3.1 Get All Prompts (Paginated)
**GET** `/api/prompts`

Query Parameters:
- `page`: int (default: 0)
- `size`: int (default: 20, max: 100)
- `sort`: string (default: "createdAt,desc")
- `search`: string (optional, search in title and content)
- `category`: string (optional)

Response (200 OK):
```json
{
  "content": [
    {
      "id": "long",
      "title": "string",
      "description": "string",
      "content": "string",
      "category": "string",
      "tags": ["string"],
      "author": {
        "id": "long",
        "nickname": "string"
      },
      "likeCount": "int",
      "viewCount": "int",
      "averageRating": "float",
      "ratingCount": "int",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "totalElements": "long",
  "totalPages": "int",
  "page": "int",
  "size": "int",
  "first": "boolean",
  "last": "boolean"
}
```

#### 3.2 Get Single Prompt
**GET** `/api/prompts/{id}`

Response (200 OK):
```json
{
  "id": "long",
  "title": "string",
  "description": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "author": {
    "id": "long",
    "nickname": "string"
  },
  "likeCount": "int",
  "viewCount": "int",
  "isLiked": "boolean",
  "averageRating": "float",
  "ratingCount": "int",
  "userRating": "int",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Error Responses:
- 404: Prompt not found

#### 3.3 Create Prompt
**POST** `/api/prompts`
*Requires Authentication*

Request Body:
```json
{
  "title": "string",
  "description": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"]
}
```

Response (201 Created):
```json
{
  "id": "long",
  "title": "string",
  "description": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "author": {
    "id": "long",
    "nickname": "string"
  },
  "likeCount": 0,
  "viewCount": 0,
  "averageRating": 0.0,
  "ratingCount": 0,
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Error Responses:
- 400: Invalid input data
- 401: Unauthorized

#### 3.4 Update Prompt
**PUT** `/api/prompts/{id}`
*Requires Authentication (Author only)*

Request Body:
```json
{
  "title": "string",
  "description": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"]
}
```

Response (200 OK):
```json
{
  "id": "long",
  "title": "string",
  "description": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "author": {
    "id": "long",
    "nickname": "string"
  },
  "likeCount": "int",
  "viewCount": "int",
  "averageRating": "float",
  "ratingCount": "int",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Error Responses:
- 400: Invalid input data
- 401: Unauthorized
- 403: Forbidden (not the author)
- 404: Prompt not found

#### 3.5 Delete Prompt
**DELETE** `/api/prompts/{id}`
*Requires Authentication (Author only)*

Response (204 No Content)

Error Responses:
- 401: Unauthorized
- 403: Forbidden (not the author)
- 404: Prompt not found

#### 3.6 Like/Unlike Prompt
**POST** `/api/prompts/{id}/like`
*Requires Authentication*

Response (200 OK):
```json
{
  "liked": "boolean",
  "likeCount": "int"
}
```

Error Responses:
- 401: Unauthorized
- 404: Prompt not found

### 4. Rating APIs

#### 4.1 Create Rating
**POST** `/api/prompts/{promptId}/ratings`
*Requires Authentication*

Request Body:
```json
{
  "rating": "int",
  "comment": "string (optional)"
}
```

Response (201 Created):
```json
{
  "id": "long",
  "userId": "long",
  "userNickname": "string",
  "promptId": "long",
  "rating": "int",
  "comment": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Error Responses:
- 400: Invalid rating value (must be 1-5) or comment exceeds 1000 characters
- 401: Unauthorized
- 403: Cannot rate your own prompt
- 404: Prompt not found
- 409: Rating already exists

#### 4.2 Update Rating
**PUT** `/api/prompts/{promptId}/ratings`
*Requires Authentication*

Request Body:
```json
{
  "rating": "int",
  "comment": "string (optional)"
}
```

Response (200 OK):
```json
{
  "id": "long",
  "userId": "long",
  "userNickname": "string",
  "promptId": "long",
  "rating": "int",
  "comment": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Error Responses:
- 400: Invalid rating value (must be 1-5) or comment exceeds 1000 characters
- 401: Unauthorized
- 403: Can only update your own rating
- 404: Rating not found

#### 4.3 Delete Rating
**DELETE** `/api/prompts/{promptId}/ratings`
*Requires Authentication*

Response (200 OK):
```json
{
  "message": "string",
  "promptId": "long",
  "userId": "long"
}
```

Error Responses:
- 401: Unauthorized
- 403: Can only delete your own rating
- 404: Rating not found

#### 4.4 Get User's Rating for Prompt
**GET** `/api/prompts/{promptId}/ratings/user`
*Requires Authentication*

Response (200 OK):
```json
{
  "id": "long",
  "userId": "long",
  "userNickname": "string",
  "promptId": "long",
  "rating": "int",
  "comment": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

Response (204 No Content) - If no rating exists

Error Responses:
- 401: Unauthorized

#### 4.5 Get All Ratings for Prompt
**GET** `/api/prompts/{promptId}/ratings`

Query Parameters:
- `page`: int (default: 0)
- `size`: int (default: 10)
- `sortBy`: string (default: "createdAt")
- `sortDirection`: string (default: "DESC")
- `withComments`: boolean (default: false) - Filter to show only ratings with comments

Response (200 OK):
```json
{
  "content": [
    {
      "id": "long",
      "userId": "long",
      "userNickname": "string",
      "promptId": "long",
      "rating": "int",
      "comment": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "totalElements": "long",
  "totalPages": "int",
  "page": "int",
  "size": "int",
  "first": "boolean",
  "last": "boolean"
}
```

#### 4.6 Get Rating Statistics for Prompt
**GET** `/api/prompts/{promptId}/ratings/stats`

Response (200 OK):
```json
{
  "promptId": "long",
  "averageRating": "float",
  "totalRatings": "int",
  "ratingDistribution": {
    "1": "int",
    "2": "int",
    "3": "int",
    "4": "int",
    "5": "int"
  }
}
```

#### 4.7 Get All Ratings by User
**GET** `/api/users/{userId}/ratings`

Query Parameters:
- `page`: int (default: 0)
- `size`: int (default: 20)
- `sortBy`: string (default: "createdAt")
- `sortDirection`: string (default: "DESC")

Response (200 OK):
```json
{
  "content": [
    {
      "id": "long",
      "userId": "long",
      "promptId": "long",
      "promptTitle": "string",
      "rating": "int",
      "comment": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ],
  "totalElements": "long",
  "totalPages": "int",
  "page": "int",
  "size": "int",
  "first": "boolean",
  "last": "boolean"
}
```

#### 4.8 Get Recent Rating Comments
**GET** `/api/prompts/{promptId}/ratings/comments`

Get recent rating comments for a prompt (paginated).

Query Parameters:
- `page`: int (default: 0)
- `size`: int (default: 10)

Response (200 OK):
```json
{
  "content": [
    {
      "id": "long",
      "userId": "long",
      "userNickname": "string",
      "rating": "int",
      "comment": "string",
      "createdAt": "datetime"
    }
  ],
  "totalElements": "long",
  "totalPages": "int",
  "page": "int",
  "size": "int",
  "first": "boolean",
  "last": "boolean"
}
```

Error Responses:
- 404: Prompt not found

### 5. Categories API

#### 5.1 Get All Categories
**GET** `/api/v1/categories`

Response (200 OK):
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string"
  }
]
```

## Common Error Response Format
```json
{
  "timestamp": "datetime",
  "status": "int",
  "error": "string",
  "message": "string",
  "path": "string"
}
```

## Data Validation Rules

### User Registration
- Email: Valid email format, max 255 characters
- Password: Min 6 characters
- Nickname: 2-30 characters, alphanumeric and underscores only

### Prompt Creation/Update
- Title: Required, 5-100 characters
- Description: Required, 10-300 characters
- Content: Required, 20-10000 characters
- Category: Required, must be from predefined list
- Tags: Optional, max 5 tags, each tag 2-20 characters

### Rating
- Rating value: Required, integer between 1-5 (inclusive)
- Comment: Optional, maximum 1000 characters
- HTML tags in comments are sanitized for XSS prevention
- Empty or whitespace-only comments are treated as null
- One rating per user per prompt
- Users cannot rate their own prompts

## Rate Limiting
- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour
- POST/PUT/DELETE operations: 30 requests per minute

## Pagination
- Default page size: 20
- Maximum page size: 100
- Sort options: createdAt, updatedAt, likeCount, viewCount, averageRating
- Sort direction: asc, desc

## Server Configuration
- Server Port: 9090
- Context Path: None (root context)
- Database: PostgreSQL (port 5434)
- Connection Pool: HikariCP (10 max connections, 5 min idle)

## CORS Configuration
- Allowed Origins: http://localhost:4000, http://localhost:5173
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed Headers: * (all headers)
- Allow Credentials: true
- Max Age: 3600 seconds

## Predefined Categories
- coding
- writing
- analysis
- design
- marketing
- education
- productivity
- other

## Request/Response DTOs

### Rating Request DTOs

#### CreateRatingRequest
```kotlin
data class CreateRatingRequest(
    @field:Min(1)
    @field:Max(5)
    val rating: Int,

    @field:Size(max = 1000, message = "Comment must not exceed 1000 characters")
    val comment: String? = null
)
```

#### UpdateRatingRequest
```kotlin
data class UpdateRatingRequest(
    @field:Min(1)
    @field:Max(5)
    val rating: Int,

    @field:Size(max = 1000, message = "Comment must not exceed 1000 characters")
    val comment: String? = null
)
```

### Rating Response DTOs

#### RatingResponse
```kotlin
data class RatingResponse(
    val id: Long,
    val userId: Long,
    val userNickname: String,
    val promptId: Long,
    val rating: Int,
    val comment: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)
```

#### RatingCommentResponse
```kotlin
data class RatingCommentResponse(
    val id: Long,
    val userId: Long,
    val userNickname: String,
    val rating: Int,
    val comment: String,
    val createdAt: LocalDateTime
)
```

## Security Considerations

### XSS Protection
- All user-generated content (including rating comments) must be sanitized before storage
- Use HTML sanitization libraries (e.g., OWASP Java HTML Sanitizer)
- Strip or encode dangerous HTML tags and JavaScript
- Whitelist safe HTML tags if rich text is needed (e.g., `<b>`, `<i>`, `<p>`)

### Input Validation
- Server-side validation for all inputs
- Comment length validation (max 1000 characters)
- Rating value validation (1-5 integer only)
- Null/empty comment handling

### Data Integrity
- Enforce unique constraint on (user_id, prompt_id) at database level
- Use transactions for rating updates that affect denormalized counts
- Validate user ownership before allowing updates/deletes

### Performance Optimization
- Index on created_at for chronological sorting
- Partial index on comments for filtered queries
- Consider caching frequently accessed rating comments
- Implement pagination with reasonable defaults (10 items per page)