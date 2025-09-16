package com.promptdriver.service

import com.promptdriver.config.JwtProperties
import com.promptdriver.dto.request.LoginRequest
import com.promptdriver.dto.request.RefreshTokenRequest
import com.promptdriver.dto.request.RegisterRequest
import com.promptdriver.dto.response.AuthResponse
import com.promptdriver.dto.response.UserRegistrationResponse
import com.promptdriver.entity.RefreshToken
import com.promptdriver.entity.User
import com.promptdriver.entity.UserRole
import com.promptdriver.exception.*
import com.promptdriver.repository.RefreshTokenRepository
import com.promptdriver.repository.UserRepository
import com.promptdriver.security.JwtTokenProvider
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
    private val authenticationManager: AuthenticationManager,
    private val jwtProperties: JwtProperties
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)
    
    fun register(request: RegisterRequest): UserRegistrationResponse {
        logger.debug("Registering new user with email: ${request.email}")
        
        // Check if user already exists
        if (userRepository.existsByEmail(request.email)) {
            throw UserAlreadyExistsException("User with email ${request.email} already exists")
        }
        
        if (userRepository.existsByNickname(request.nickname)) {
            throw UserAlreadyExistsException("User with nickname ${request.nickname} already exists")
        }
        
        // Create new user
        val user = User(
            email = request.email,
            password = passwordEncoder.encode(request.password),
            nickname = request.nickname,
            role = UserRole.USER
        )
        
        val savedUser = userRepository.save(user)
        logger.info("User registered successfully with id: ${savedUser.id}")
        
        return UserRegistrationResponse(
            id = savedUser.id,
            email = savedUser.email,
            nickname = savedUser.nickname,
            createdAt = savedUser.createdAt
        )
    }
    
    fun login(request: LoginRequest): AuthResponse {
        logger.debug("User login attempt for email: ${request.email}")
        
        try {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.email, request.password)
            )
        } catch (e: BadCredentialsException) {
            logger.error("Invalid credentials for email: ${request.email}")
            throw InvalidCredentialsException()
        }
        
        val user = userRepository.findByEmail(request.email)
            ?: throw UserNotFoundException()
        
        if (!user.isActive) {
            throw InvalidCredentialsException("Account is not active")
        }
        
        // Generate tokens
        val accessToken = jwtTokenProvider.createAccessToken(user.email, user.role.name)
        val refreshToken = jwtTokenProvider.createRefreshToken(user.email)
        
        // Save refresh token
        saveRefreshToken(user, refreshToken)
        
        logger.info("User logged in successfully: ${user.email}")
        
        return AuthResponse(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtProperties.accessTokenExpiration / 1000 // Convert to seconds
        )
    }
    
    fun refreshToken(request: RefreshTokenRequest): AuthResponse {
        logger.debug("Refreshing token")
        
        // Validate refresh token
        if (!jwtTokenProvider.validateToken(request.refreshToken)) {
            throw InvalidTokenException("Invalid refresh token")
        }
        
        // Find refresh token in database
        val storedToken = refreshTokenRepository.findByToken(request.refreshToken)
            ?: throw InvalidTokenException("Refresh token not found")
        
        // Check if refresh token is expired
        if (storedToken.expiresAt.isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken)
            throw ExpiredTokenException("Refresh token has expired")
        }
        
        val user = storedToken.user
        
        // Generate new tokens
        val newAccessToken = jwtTokenProvider.createAccessToken(user.email, user.role.name)
        val newRefreshToken = jwtTokenProvider.createRefreshToken(user.email)
        
        // Delete old refresh token and save new one
        refreshTokenRepository.delete(storedToken)
        saveRefreshToken(user, newRefreshToken)
        
        logger.info("Token refreshed successfully for user: ${user.email}")
        
        return AuthResponse(
            accessToken = newAccessToken,
            refreshToken = newRefreshToken,
            expiresIn = jwtProperties.accessTokenExpiration / 1000
        )
    }
    
    fun logout(email: String) {
        logger.debug("Logging out user: $email")
        
        val user = userRepository.findByEmail(email)
            ?: throw UserNotFoundException()
        
        // Delete all refresh tokens for the user
        refreshTokenRepository.deleteByUser(user)
        
        logger.info("User logged out successfully: $email")
    }
    
    private fun saveRefreshToken(user: User, token: String) {
        // Clean up old refresh tokens for the user (keep only last 5)
        val existingTokens = refreshTokenRepository.findByUserOrderByCreatedAtDesc(user)
        if (existingTokens.size >= 5) {
            val tokensToDelete = existingTokens.drop(4)
            refreshTokenRepository.deleteAll(tokensToDelete)
        }
        
        val refreshToken = RefreshToken(
            token = token,
            user = user,
            expiresAt = LocalDateTime.now().plusSeconds(jwtProperties.refreshTokenExpiration / 1000)
        )
        
        refreshTokenRepository.save(refreshToken)
    }
}