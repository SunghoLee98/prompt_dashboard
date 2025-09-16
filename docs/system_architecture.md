# System Architecture

## Overview
The Prompt Driver system is a web-based platform for sharing and discovering AI prompts. It follows a three-tier architecture with clear separation of concerns between presentation, business logic, and data persistence layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│                  React + TypeScript SPA                      │
│                  - Components                                │
│                  - Redux Store                               │
│                  - API Services                              │
└────────────────────┬───────────────────────────────────────┘
                     │ HTTPS/REST API
                     │ JWT Authentication
┌────────────────────▼───────────────────────────────────────┐
│                  API Gateway Layer                          │
├─────────────────────────────────────────────────────────────┤
│                 Spring Boot Application                      │
│                  - REST Controllers                          │
│                  - Security Filters                          │
│                  - CORS Configuration                        │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                Business Logic Layer                          │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│                  - AuthService                               │
│                  - UserService                               │
│                  - PromptService                             │
│                  - RatingService                             │
│                  - ValidationService                         │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                 Data Access Layer                            │
├─────────────────────────────────────────────────────────────┤
│                 JPA Repositories                             │
│                  - UserRepository                            │
│                  - PromptRepository                          │
│                  - PromptLikeRepository                      │
│                  - PromptRatingRepository                    │
│                  - RefreshTokenRepository                    │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                   Database Layer                             │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL                                │
│                  - Users Table                               │
│                  - Prompts Table                             │
│                  - Likes Table                               │
│                  - Ratings Table                             │
│                  - Tags Table                                │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Backend (Spring Boot + Kotlin)

```
prompt-driver-backend/
├── src/main/kotlin/com/promptdriver/
│   ├── PromptDriverApplication.kt
│   ├── config/
│   │   ├── SecurityConfig.kt
│   │   ├── WebConfig.kt
│   │   ├── JwtConfig.kt
│   │   └── DatabaseConfig.kt
│   ├── controller/
│   │   ├── AuthController.kt
│   │   ├── UserController.kt
│   │   ├── PromptController.kt
│   │   └── CategoryController.kt
│   ├── service/
│   │   ├── AuthService.kt
│   │   ├── UserService.kt
│   │   ├── PromptService.kt
│   │   ├── RatingService.kt
│   │   └── TokenService.kt
│   ├── repository/
│   │   ├── UserRepository.kt
│   │   ├── PromptRepository.kt
│   │   ├── PromptLikeRepository.kt
│   │   ├── PromptRatingRepository.kt
│   │   └── RefreshTokenRepository.kt
│   ├── entity/
│   │   ├── User.kt
│   │   ├── Prompt.kt
│   │   ├── PromptLike.kt
│   │   ├── PromptRating.kt
│   │   └── RefreshToken.kt
│   ├── dto/
│   │   ├── request/
│   │   │   ├── LoginRequest.kt
│   │   │   ├── RegisterRequest.kt
│   │   │   ├── PromptCreateRequest.kt
│   │   │   └── PromptUpdateRequest.kt
│   │   └── response/
│   │       ├── AuthResponse.kt
│   │       ├── UserResponse.kt
│   │       ├── PromptResponse.kt
│   │       └── PageResponse.kt
│   ├── security/
│   │   ├── JwtAuthenticationFilter.kt
│   │   ├── JwtTokenProvider.kt
│   │   └── UserDetailsServiceImpl.kt
│   ├── exception/
│   │   ├── GlobalExceptionHandler.kt
│   │   ├── BusinessException.kt
│   │   └── ErrorCode.kt
│   └── util/
│       ├── PageableUtil.kt
│       └── ValidationUtil.kt
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── db/migration/
│       ├── V1__create_users_table.sql
│       ├── V2__create_prompts_table.sql
│       ├── V3__create_likes_table.sql
│       └── V4__create_ratings_table.sql
└── src/test/kotlin/
    └── com/promptdriver/
        ├── controller/
        ├── service/
        └── repository/
```

### Frontend (React + TypeScript)

```
prompt-driver-frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── PrivateRoute.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── prompt/
│   │   │   ├── PromptList.tsx
│   │   │   ├── PromptCard.tsx
│   │   │   ├── PromptDetail.tsx
│   │   │   ├── PromptForm.tsx
│   │   │   ├── PromptSearch.tsx
│   │   │   └── PromptRating.tsx
│   │   └── user/
│   │       ├── UserProfile.tsx
│   │       └── UserPrompts.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── PromptListPage.tsx
│   │   ├── PromptDetailPage.tsx
│   │   ├── PromptCreatePage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── promptService.ts
│   │   └── userService.ts
│   ├── store/
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   ├── promptSlice.ts
│   │   └── userSlice.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── prompt.types.ts
│   │   └── user.types.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── validation.ts
│   │   └── storage.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePrompts.ts
│   │   └── usePagination.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
└── tsconfig.json
```

## Technology Stack Details

### Backend Technologies
- **Framework**: Spring Boot 3.x
- **Language**: Kotlin 1.9+
- **Database**: PostgreSQL 14+
- **ORM**: Spring Data JPA with Hibernate
- **Security**: Spring Security + JWT
- **Validation**: Jakarta Bean Validation
- **Migration**: Flyway
- **Testing**: JUnit 5, MockK, TestContainers
- **Build Tool**: Gradle with Kotlin DSL

### Frontend Technologies
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **UI Components**: Material-UI or Ant Design
- **Form Handling**: React Hook Form
- **Validation**: Yup
- **Testing**: Jest, React Testing Library
- **Build Tool**: Vite

### Infrastructure & DevOps
- **Container**: Docker
- **Container Orchestration**: Docker Compose (development)
- **CI/CD**: GitHub Actions
- **Monitoring**: Spring Boot Actuator
- **Logging**: SLF4J with Logback
- **API Documentation**: OpenAPI 3.0 (Swagger)

## Security Architecture

### Authentication Flow
1. User submits credentials to `/api/v1/auth/login`
2. Server validates credentials against database
3. Server generates JWT access token (15 minutes) and refresh token (7 days)
4. Client stores tokens securely (httpOnly cookies recommended)
5. Client includes access token in Authorization header for protected requests
6. Server validates token on each request
7. Client refreshes access token using refresh token when expired

### Security Measures
- **Password Security**: BCrypt hashing with salt rounds = 10
- **JWT Security**: RS256 algorithm with rotating keys
- **CORS**: Configured for specific origins only
- **Rate Limiting**: Implemented at API gateway level
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries via JPA
- **XSS Prevention**: Input sanitization and output encoding
- **CSRF Protection**: Token-based for state-changing operations

### Authorization Model
- **Role-Based Access Control (RBAC)**
  - USER: Can create, edit own prompts, like prompts, rate other users' prompts
  - ADMIN: Full access to all resources
- **Resource-Based Authorization**
  - Users can only modify their own resources
  - Users cannot rate their own prompts
  - Public prompts visible to all, private only to owner

## API Design Principles

### RESTful Conventions
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URLs with nouns
- Consistent naming conventions (camelCase for JSON)
- Proper status codes (2xx success, 4xx client error, 5xx server error)
- HATEOAS for discoverability (optional)

### Pagination Strategy
- Cursor-based pagination for large datasets
- Page-based pagination for UI convenience
- Default page size: 20, max: 100
- Include metadata (totalElements, totalPages, etc.)

### Error Handling
- Consistent error response format
- Meaningful error messages
- Include error codes for client handling
- Log errors with correlation IDs

### Versioning Strategy
- URL path versioning (`/api/v1/`)
- Backward compatibility for minor versions
- Deprecation notices for breaking changes

## Performance Optimization

### Backend Optimization
- **Database Indexing**: Indexes on frequently queried columns
- **Query Optimization**: Use projections for read-only operations
- **Caching**: Redis for session storage and frequently accessed data
- **Connection Pooling**: HikariCP with optimized settings
- **Lazy Loading**: For related entities to reduce memory usage
- **Batch Processing**: For bulk operations
- **Denormalized Aggregates**: Average rating and count cached in prompts table

### Frontend Optimization
- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Components and images
- **Caching**: Browser cache and service workers
- **Bundle Optimization**: Tree shaking and minification
- **State Management**: Normalized state structure
- **Virtual Scrolling**: For large lists

### API Optimization
- **Response Compression**: Gzip compression
- **Field Filtering**: Allow clients to specify required fields
- **HTTP/2**: For multiplexing and server push
- **CDN**: For static assets
- **Rate Limiting**: Prevent abuse and ensure fair usage

## Deployment Architecture

### Development Environment
- Docker Compose for local development
- Hot reload for both frontend and backend
- PostgreSQL in Docker container
- Environment variables for configuration

### Production Environment
- Containerized deployment with Docker
- Reverse proxy (Nginx) for SSL termination
- PostgreSQL managed database service
- Horizontal scaling for backend services
- Static frontend served from CDN
- Health checks and monitoring

### Environment Configuration
- **Development**: Local Docker setup with debug enabled
- **Staging**: Production-like environment for testing
- **Production**: Optimized settings with monitoring

## Monitoring and Observability

### Application Monitoring
- Spring Boot Actuator endpoints
- Custom metrics for business KPIs
- Health checks for dependencies
- Performance metrics (response time, throughput)

### Logging Strategy
- Structured logging in JSON format
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracing
- Centralized log aggregation

### Error Tracking
- Exception tracking with stack traces
- User impact assessment
- Alert rules for critical errors
- Error rate monitoring

## Scalability Considerations

### Horizontal Scaling
- Stateless backend services
- Session storage in Redis
- Database read replicas
- Load balancing with health checks

### Vertical Scaling
- JVM tuning for optimal memory usage
- Database connection pool sizing
- Thread pool configuration
- Cache sizing

### Future Scaling Options
- Microservices architecture
- Event-driven architecture with message queues
- CQRS for read/write separation
- GraphQL for flexible data fetching