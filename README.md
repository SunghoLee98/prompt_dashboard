# Prompt Driver Backend

Spring Boot + Kotlin backend for the Prompt Driver - AI prompt sharing platform.

## 🚀 Implementation Summary

This backend implementation includes:

### ✅ Core Features
- **JWT Authentication System**: Secure token-based authentication with access/refresh tokens
- **User Management**: Registration, login, profile management
- **Prompt Management**: CRUD operations with search, pagination, and categorization
- **Like System**: Users can like/unlike prompts
- **View Tracking**: Automatic view count tracking

### 🏗 Architecture Components

#### Security Layer
- JWT token provider with HMAC-SHA256 signing
- Custom authentication filter
- Spring Security configuration with role-based access control
- BCrypt password encryption

#### REST API Controllers
- `AuthController`: Registration, login, token refresh, logout
- `UserController`: User profile management
- `PromptController`: Prompt CRUD operations and interactions
- `CategoryController`: Category listing

#### Service Layer
- `AuthService`: Authentication logic and token management
- `UserService`: User operations
- `PromptService`: Prompt business logic with search and filtering

#### Data Layer
- JPA Entities: User, Prompt, PromptLike, RefreshToken
- Spring Data JPA repositories with custom queries
- PostgreSQL database with optimized indexes
- Flyway migrations for database versioning

#### Exception Handling
- Global exception handler
- Custom business exceptions
- Structured error responses

## 📋 Prerequisites

- Java 17+
- PostgreSQL 14+
- Gradle 8.x

## 🔧 Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE prompt_driver;
CREATE USER prompt_user WITH PASSWORD 'prompt_password';
GRANT ALL PRIVILEGES ON DATABASE prompt_driver TO prompt_user;
```

### 2. Configure Application

The application is pre-configured in `src/main/resources/application.yml`. 
Update database credentials if needed.

### 3. Run the Application

```bash
# Build the project
./gradlew clean build

# Run the application
./gradlew bootRun
```

The application will start on `http://localhost:9090`

## 📚 API Documentation

Once the application is running, access the Swagger UI at:
```
http://localhost:9090/swagger-ui.html
```

## 🧪 Testing

Run unit tests:
```bash
./gradlew test
```

Run with coverage:
```bash
./gradlew test jacocoTestReport
```

## 🐳 Docker Support

Run with Docker Compose (includes PostgreSQL):
```bash
docker-compose up -d
```

## 📁 Project Structure

```
src/main/kotlin/com/promptdriver/
├── config/          # Configuration classes (Security, JWT, JPA, OpenAPI)
├── controller/      # REST API controllers
├── dto/            
│   ├── request/    # Request DTOs with validation
│   └── response/   # Response DTOs
├── entity/         # JPA entities
├── exception/      # Custom exceptions and error handling
├── repository/     # Spring Data JPA repositories
├── security/       # JWT and authentication components
└── service/        # Business logic services
```

## 🔑 Key API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile

### Prompts
- `GET /api/v1/prompts` - Get all prompts (paginated)
- `GET /api/v1/prompts/{id}` - Get single prompt
- `POST /api/v1/prompts` - Create new prompt (auth required)
- `PUT /api/v1/prompts/{id}` - Update prompt (author only)
- `DELETE /api/v1/prompts/{id}` - Delete prompt (author only)
- `POST /api/v1/prompts/{id}/like` - Toggle like status

### Categories
- `GET /api/v1/categories` - Get all categories

## 🛡 Security Features

- JWT-based authentication with 15-minute access tokens
- Refresh tokens with 7-day expiration
- Password validation (min 8 chars, mixed case, numbers)
- CORS configuration for frontend integration
- Rate limiting ready (configurable)
- SQL injection prevention through JPA
- XSS protection through input validation

## 📊 Database Schema

The application uses Flyway migrations to manage the database schema. 
Migrations are located in `src/main/resources/db/migration/`

Key tables:
- `users` - User accounts
- `prompts` - Prompt content
- `prompt_tags` - Tags for prompts
- `prompt_likes` - User likes on prompts
- `refresh_tokens` - JWT refresh tokens

## 🎯 Performance Optimizations

- Database indexes on frequently queried columns
- Full-text search index for prompt content
- Lazy loading for JPA relationships
- Connection pooling with HikariCP
- Denormalized like counts for faster queries
- Paginated responses (max 100 items per page)

## 📈 Monitoring

Health check endpoint:
```
GET /actuator/health
```

## 🤝 Contributing

Follow the existing code patterns and ensure all tests pass before submitting changes.

## 📄 License

MIT License