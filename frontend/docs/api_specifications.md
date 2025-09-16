# API Specifications

## Overview
This document defines the RESTful API specifications for the Prompt Driver application. All APIs follow REST conventions with proper HTTP methods and status codes.

## Base URL
- Development: `http://localhost:8080`
- Production: TBD

## Authentication
The API uses JWT (JSON Web Token) based authentication with access tokens and refresh tokens.

### JWT Token Structure
- **Access Token**: Short-lived token (15 minutes) for API authentication
- **Refresh Token**: Long-lived token (7 days) for obtaining new access tokens
- **Token Format**: Bearer token in Authorization header

### Authentication Header
```
Authorization: Bearer <access_token>
```

## Common Response Formats

### Success Response
```json
{
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Error Response
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Detailed error message",
  "path": "/api/endpoint"
}
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | BAD_REQUEST | Invalid request parameters or body |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists (e.g., duplicate email) |
| 422 | UNPROCESSABLE_ENTITY | Validation errors |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | INTERNAL_SERVER_ERROR | Server error |

## API Endpoints

### 1. Authentication APIs

#### 1.1 User Registration
**Endpoint:** `POST /api/auth/register`  
**Authentication:** Not required  
**Description:** Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "nickname": "johndoe"
}
```

**Validation Rules:**
- `email`: Required, valid email format, max 255 characters, must be unique
- `password`: Required, min 8 characters, must contain uppercase, lowercase, number, and special character
- `nickname`: Required, 3-20 characters, alphanumeric and underscores only, must be unique

**Success Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "johndoe",
  "role": "USER",
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

**Error Response (409 Conflict):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 409,
  "error": "CONFLICT",
  "message": "Email already exists",
  "path": "/api/auth/register"
}
```

**Error Response (400 Bad Request):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "errors": {
    "password": "Password must be at least 8 characters",
    "email": "Invalid email format"
  },
  "path": "/api/auth/register"
}
```

#### 1.2 User Login
**Endpoint:** `POST /api/auth/login`  
**Authentication:** Not required  
**Description:** Authenticate user and receive JWT tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "johndoe",
    "role": "USER"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password",
  "path": "/api/auth/login"
}
```

#### 1.3 Refresh Token
**Endpoint:** `POST /api/auth/refresh`  
**Authentication:** Not required  
**Description:** Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Error Response (401 Unauthorized):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired refresh token",
  "path": "/api/auth/refresh"
}
```

#### 1.4 Logout
**Endpoint:** `POST /api/auth/logout`  
**Authentication:** Required  
**Description:** Invalidate current refresh token

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

### 2. User Management APIs

#### 2.1 Get Current User Profile
**Endpoint:** `GET /api/users/me`  
**Authentication:** Required  
**Description:** Get current authenticated user's profile

**Success Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "johndoe",
  "role": "USER",
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z",
  "promptCount": 15,
  "likeCount": 42
}
```

**Error Response (401 Unauthorized):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "path": "/api/users/me"
}
```

#### 2.2 Update User Profile
**Endpoint:** `PUT /api/users/me`  
**Authentication:** Required  
**Description:** Update current user's profile

**Request Body:**
```json
{
  "nickname": "newNickname",
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Validation Rules:**
- `nickname`: Optional, 3-20 characters, alphanumeric and underscores only, must be unique
- `currentPassword`: Required if changing password
- `newPassword`: Optional, min 8 characters, must contain uppercase, lowercase, number, and special character

**Success Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "newNickname",
  "role": "USER",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### 3. Prompt Management APIs

#### 3.1 Get Prompts (List)
**Endpoint:** `GET /api/prompts`  
**Authentication:** Optional  
**Description:** Get paginated list of public prompts

**Query Parameters:**
- `page`: Page number (0-based, default: 0)
- `size`: Page size (default: 20, max: 100)
- `sort`: Sort field and direction (e.g., `createdAt,desc`, `likes,desc`, `views,desc`, `averageRating,desc`)
- `category`: Filter by category (GENERAL, PROGRAMMING, WRITING, BUSINESS, EDUCATION, CREATIVE, TECHNICAL, OTHER)
- `search`: Full-text search in title, description, and content
- `tags`: Comma-separated tag names for filtering

**Success Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Code Review Assistant",
      "description": "A prompt for thorough code reviews",
      "content": "You are an expert code reviewer...",
      "category": "PROGRAMMING",
      "tags": ["code-review", "best-practices"],
      "authorId": 1,
      "authorNickname": "johndoe",
      "likes": 42,
      "views": 150,
      "averageRating": 4.5,
      "ratingCount": 10,
      "isPublic": true,
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z",
      "liked": false,
      "userRating": null
    }
  ],
  "pageable": {
    "sort": {
      "sorted": true,
      "ascending": false
    },
    "pageNumber": 0,
    "pageSize": 20,
    "offset": 0,
    "paged": true
  },
  "totalElements": 100,
  "totalPages": 5,
  "last": false,
  "first": true,
  "numberOfElements": 20,
  "empty": false
}
```

**Error Response (401 Unauthorized - for protected prompts):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 401,
  "error": "UNAUTHORIZED",
  "message": "Authentication required to access protected prompts",
  "path": "/api/prompts"
}
```

#### 3.2 Get Single Prompt
**Endpoint:** `GET /api/prompts/{id}`  
**Authentication:** Optional (required for private prompts)  
**Description:** Get a single prompt by ID

**Path Parameters:**
- `id`: Prompt ID (Long)

**Success Response (200 OK):**
```json
{
  "id": 1,
  "title": "Code Review Assistant",
  "description": "A prompt for thorough code reviews",
  "content": "You are an expert code reviewer...",
  "category": "PROGRAMMING",
  "tags": ["code-review", "best-practices"],
  "authorId": 1,
  "authorNickname": "johndoe",
  "likes": 42,
  "views": 151,
  "averageRating": 4.5,
  "ratingCount": 10,
  "isPublic": true,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z",
  "liked": false,
  "userRating": 4
}
```

**Note:** View count is incremented on each successful retrieval.

**Error Response (404 Not Found):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Prompt not found",
  "path": "/api/prompts/1"
}
```

#### 3.3 Create Prompt
**Endpoint:** `POST /api/prompts`  
**Authentication:** Required  
**Description:** Create a new prompt

**Request Body:**
```json
{
  "title": "Code Review Assistant",
  "description": "A prompt for thorough code reviews",
  "content": "You are an expert code reviewer...",
  "category": "PROGRAMMING",
  "tags": ["code-review", "best-practices"],
  "isPublic": true
}
```

**Validation Rules:**
- `title`: Required, 5-200 characters
- `description`: Required, 10-500 characters
- `content`: Required, 10-10000 characters
- `category`: Required, must be valid category enum
- `tags`: Optional, max 5 tags, each tag 2-30 characters, alphanumeric and hyphens only
- `isPublic`: Optional, default true

**Success Response (201 Created):**
```json
{
  "id": 1,
  "title": "Code Review Assistant",
  "description": "A prompt for thorough code reviews",
  "content": "You are an expert code reviewer...",
  "category": "PROGRAMMING",
  "tags": ["code-review", "best-practices"],
  "authorId": 1,
  "authorNickname": "johndoe",
  "likes": 0,
  "views": 0,
  "averageRating": null,
  "ratingCount": 0,
  "isPublic": true,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "errors": {
    "title": "Title must be between 5 and 200 characters",
    "tags": "Maximum 5 tags allowed"
  },
  "path": "/api/prompts"
}
```

#### 3.4 Update Prompt
**Endpoint:** `PUT /api/prompts/{id}`  
**Authentication:** Required  
**Description:** Update an existing prompt (only by author)

**Path Parameters:**
- `id`: Prompt ID (Long)

**Request Body:**
```json
{
  "title": "Updated Code Review Assistant",
  "description": "An improved prompt for code reviews",
  "content": "You are an expert code reviewer with focus on...",
  "category": "PROGRAMMING",
  "tags": ["code-review", "best-practices", "refactoring"],
  "isPublic": true
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "title": "Updated Code Review Assistant",
  "description": "An improved prompt for code reviews",
  "content": "You are an expert code reviewer with focus on...",
  "category": "PROGRAMMING",
  "tags": ["code-review", "best-practices", "refactoring"],
  "authorId": 1,
  "authorNickname": "johndoe",
  "likes": 42,
  "views": 151,
  "averageRating": 4.5,
  "ratingCount": 10,
  "isPublic": true,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T13:00:00Z"
}
```

**Error Response (403 Forbidden):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 403,
  "error": "FORBIDDEN",
  "message": "You can only edit your own prompts",
  "path": "/api/prompts/1"
}
```

#### 3.5 Delete Prompt
**Endpoint:** `DELETE /api/prompts/{id}`  
**Authentication:** Required  
**Description:** Delete a prompt (only by author or admin)

**Path Parameters:**
- `id`: Prompt ID (Long)

**Success Response (204 No Content):**
No response body

**Error Response (403 Forbidden):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 403,
  "error": "FORBIDDEN",
  "message": "You can only delete your own prompts",
  "path": "/api/prompts/1"
}
```

### 4. Like Management APIs

#### 4.1 Like a Prompt
**Endpoint:** `POST /api/prompts/{id}/like`  
**Authentication:** Required  
**Description:** Like a prompt

**Path Parameters:**
- `id`: Prompt ID (Long)

**Success Response (200 OK):**
```json
{
  "promptId": 1,
  "liked": true,
  "likeCount": 43
}
```

**Error Response (409 Conflict):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 409,
  "error": "CONFLICT",
  "message": "You have already liked this prompt",
  "path": "/api/prompts/1/like"
}
```

#### 4.2 Unlike a Prompt
**Endpoint:** `DELETE /api/prompts/{id}/like`  
**Authentication:** Required  
**Description:** Remove like from a prompt

**Path Parameters:**
- `id`: Prompt ID (Long)

**Success Response (200 OK):**
```json
{
  "promptId": 1,
  "liked": false,
  "likeCount": 42
}
```

**Error Response (404 Not Found):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Like not found",
  "path": "/api/prompts/1/like"
}
```

### 5. Rating Management APIs

#### 5.1 Rate a Prompt
**Endpoint:** `POST /api/prompts/{id}/rate`  
**Authentication:** Required  
**Description:** Rate a prompt (1-5 stars)

**Path Parameters:**
- `id`: Prompt ID (Long)

**Request Body:**
```json
{
  "rating": 5
}
```

**Validation Rules:**
- `rating`: Required, integer 1-5
- Cannot rate your own prompts
- One rating per user per prompt (updates existing rating)

**Success Response (200 OK):**
```json
{
  "promptId": 1,
  "rating": 5,
  "averageRating": 4.6,
  "ratingCount": 11
}
```

**Error Response (403 Forbidden):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 403,
  "error": "FORBIDDEN",
  "message": "You cannot rate your own prompts",
  "path": "/api/prompts/1/rate"
}
```

#### 5.2 Update Rating
**Endpoint:** `PUT /api/prompts/{id}/rate`  
**Authentication:** Required  
**Description:** Update existing rating

**Path Parameters:**
- `id`: Prompt ID (Long)

**Request Body:**
```json
{
  "rating": 4
}
```

**Success Response (200 OK):**
```json
{
  "promptId": 1,
  "rating": 4,
  "averageRating": 4.5,
  "ratingCount": 11
}
```

#### 5.3 Delete Rating
**Endpoint:** `DELETE /api/prompts/{id}/rate`  
**Authentication:** Required  
**Description:** Remove rating from a prompt

**Path Parameters:**
- `id`: Prompt ID (Long)

**Success Response (204 No Content):**
No response body

**Error Response (404 Not Found):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Rating not found",
  "path": "/api/prompts/1/rate"
}
```

### 6. User's Prompts APIs

#### 6.1 Get My Prompts
**Endpoint:** `GET /api/users/me/prompts`  
**Authentication:** Required  
**Description:** Get current user's prompts (public and private)

**Query Parameters:**
- `page`: Page number (0-based, default: 0)
- `size`: Page size (default: 20, max: 100)
- `sort`: Sort field and direction

**Success Response (200 OK):**
Same format as prompt list endpoint, includes both public and private prompts.

#### 6.2 Get User's Public Prompts
**Endpoint:** `GET /api/users/{userId}/prompts`  
**Authentication:** Optional  
**Description:** Get a user's public prompts

**Path Parameters:**
- `userId`: User ID (Long)

**Success Response (200 OK):**
Same format as prompt list endpoint, only public prompts.

### 7. Liked Prompts API

#### 7.1 Get Liked Prompts
**Endpoint:** `GET /api/users/me/liked-prompts`  
**Authentication:** Required  
**Description:** Get prompts liked by current user

**Query Parameters:**
- `page`: Page number (0-based, default: 0)
- `size`: Page size (default: 20, max: 100)

**Success Response (200 OK):**
Same format as prompt list endpoint, all prompts have `liked: true`.

## Rate Limiting

Rate limiting is applied per IP address and authenticated user:

| User Type | Limit | Window |
|-----------|-------|--------|
| Anonymous | 100 requests | 1 hour |
| Authenticated | 1000 requests | 1 hour |
| Admin | Unlimited | - |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

**Rate Limit Exceeded Response (429 Too Many Requests):**
```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": 429,
  "error": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded. Try again in 3600 seconds",
  "path": "/api/prompts"
}
```

## Pagination

All list endpoints support pagination with the following query parameters:

- `page`: Page number (0-based indexing)
- `size`: Number of items per page (default: 20, max: 100)
- `sort`: Sort field and direction (e.g., `createdAt,desc`)

## Sorting

Supported sort fields:
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `likes`: Number of likes
- `views`: Number of views
- `averageRating`: Average rating score
- `title`: Alphabetical by title

## Filtering

Supported filters:
- `category`: Filter by category enum
- `search`: Full-text search in title, description, and content
- `tags`: Filter by tag names (comma-separated)
- `authorId`: Filter by author's user ID
- `isPublic`: Filter by visibility (true/false)

## Validation Rules Summary

### Email Validation
- Valid email format (RFC 5322)
- Maximum 255 characters
- Case-insensitive uniqueness check

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Nickname Validation
- 3-20 characters
- Alphanumeric and underscores only
- Must start with a letter
- Case-insensitive uniqueness check

### Title Validation
- 5-200 characters
- No special formatting restrictions

### Description Validation
- 10-500 characters
- Plain text only

### Content Validation
- 10-10000 characters
- Rich text support (Markdown)

### Tag Validation
- 2-30 characters per tag
- Maximum 5 tags per prompt
- Alphanumeric and hyphens only
- Lowercase enforced

### Category Validation
- Must be one of: GENERAL, PROGRAMMING, WRITING, BUSINESS, EDUCATION, CREATIVE, TECHNICAL, OTHER

### Rating Validation
- Integer values only (1, 2, 3, 4, or 5)
- No decimal values allowed

## Security Considerations

1. **Authentication**: All protected endpoints require valid JWT access token
2. **Authorization**: Users can only modify their own resources (except admins)
3. **Password Storage**: BCrypt with salt rounds = 10
4. **Token Security**: 
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Tokens are signed with HS256 algorithm
5. **Input Validation**: All inputs are validated server-side
6. **SQL Injection Prevention**: Use of parameterized queries
7. **XSS Prevention**: Input sanitization and output encoding
8. **CORS**: Configured for specific allowed origins
9. **Rate Limiting**: Protection against abuse and DDoS

## Future Enhancements (Phase 2+)

1. **Social Features**
   - Comments on prompts
   - User following system
   - Prompt collections/folders

2. **Advanced Search**
   - Elasticsearch integration
   - Semantic search
   - Search history

3. **Analytics**
   - Usage statistics
   - Popular prompts dashboard
   - Trending tags

4. **Collaboration**
   - Prompt sharing with teams
   - Version control for prompts
   - Collaborative editing

5. **AI Integration**
   - Prompt effectiveness scoring
   - AI-powered prompt suggestions
   - Prompt optimization recommendations

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API specification
- Authentication endpoints
- Prompt CRUD operations
- Like/Unlike functionality
- Rating system
- User management
- Pagination and filtering

---

*Last Updated: 2024-01-15*