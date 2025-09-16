package com.promptdriver.service

import com.promptdriver.config.JwtProperties
import com.promptdriver.dto.request.LoginRequest
import com.promptdriver.dto.request.RefreshTokenRequest
import com.promptdriver.dto.request.RegisterRequest
import com.promptdriver.entity.RefreshToken
import com.promptdriver.entity.User
import com.promptdriver.entity.UserRole
import com.promptdriver.exception.InvalidCredentialsException
import com.promptdriver.exception.UserAlreadyExistsException
import com.promptdriver.repository.RefreshTokenRepository
import com.promptdriver.repository.UserRepository
import com.promptdriver.security.JwtTokenProvider
import io.mockk.*
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.LocalDateTime

@ExtendWith(MockKExtension::class)
class AuthServiceTest {
    
    @MockK
    private lateinit var userRepository: UserRepository
    
    @MockK
    private lateinit var refreshTokenRepository: RefreshTokenRepository
    
    @MockK
    private lateinit var passwordEncoder: PasswordEncoder
    
    @MockK
    private lateinit var jwtTokenProvider: JwtTokenProvider
    
    @MockK
    private lateinit var authenticationManager: AuthenticationManager
    
    @MockK
    private lateinit var jwtProperties: JwtProperties
    
    @InjectMockKs
    private lateinit var authService: AuthService
    
    private lateinit var testUser: User
    
    @BeforeEach
    fun setup() {
        testUser = User(
            id = 1L,
            email = "test@example.com",
            password = "encodedPassword",
            nickname = "testuser",
            role = UserRole.USER
        )
    }
    
    @Test
    fun `register should create new user successfully`() {
        // Given
        val request = RegisterRequest(
            email = "new@example.com",
            password = "Password123",
            nickname = "newuser"
        )
        
        every { userRepository.existsByEmail(request.email) } returns false
        every { userRepository.existsByNickname(request.nickname) } returns false
        every { passwordEncoder.encode(request.password) } returns "encodedPassword"
        every { userRepository.save(any()) } returns User(
            id = 2L,
            email = request.email,
            password = "encodedPassword",
            nickname = request.nickname,
            role = UserRole.USER
        )
        
        // When
        val response = authService.register(request)
        
        // Then
        assertThat(response.email).isEqualTo(request.email)
        assertThat(response.nickname).isEqualTo(request.nickname)
        
        verify(exactly = 1) { userRepository.save(any()) }
    }
    
    @Test
    fun `register should throw exception when email already exists`() {
        // Given
        val request = RegisterRequest(
            email = "existing@example.com",
            password = "Password123",
            nickname = "newuser"
        )
        
        every { userRepository.existsByEmail(request.email) } returns true
        
        // When/Then
        assertThrows<UserAlreadyExistsException> {
            authService.register(request)
        }
        
        verify(exactly = 0) { userRepository.save(any()) }
    }
    
    @Test
    fun `login should return tokens for valid credentials`() {
        // Given
        val request = LoginRequest(
            email = "test@example.com",
            password = "password"
        )
        
        every { authenticationManager.authenticate(any()) } returns mockk()
        every { userRepository.findByEmail(request.email) } returns testUser
        every { jwtTokenProvider.createAccessToken(testUser.email, testUser.role.name) } returns "accessToken"
        every { jwtTokenProvider.createRefreshToken(testUser.email) } returns "refreshToken"
        every { jwtProperties.accessTokenExpiration } returns 900000L
        every { jwtProperties.refreshTokenExpiration } returns 604800000L
        every { refreshTokenRepository.findByUserOrderByCreatedAtDesc(testUser) } returns emptyList()
        every { refreshTokenRepository.save(any()) } returns mockk()
        
        // When
        val response = authService.login(request)
        
        // Then
        assertThat(response.accessToken).isEqualTo("accessToken")
        assertThat(response.refreshToken).isEqualTo("refreshToken")
        assertThat(response.tokenType).isEqualTo("Bearer")
        
        verify(exactly = 1) { authenticationManager.authenticate(any()) }
        verify(exactly = 1) { refreshTokenRepository.save(any()) }
    }
    
    @Test
    fun `login should throw exception for invalid credentials`() {
        // Given
        val request = LoginRequest(
            email = "test@example.com",
            password = "wrongpassword"
        )
        
        every { authenticationManager.authenticate(any()) } throws BadCredentialsException("Invalid credentials")
        
        // When/Then
        assertThrows<InvalidCredentialsException> {
            authService.login(request)
        }
        
        verify(exactly = 0) { jwtTokenProvider.createAccessToken(any(), any()) }
    }
    
    @Test
    fun `refreshToken should generate new tokens for valid refresh token`() {
        // Given
        val request = RefreshTokenRequest(refreshToken = "validRefreshToken")
        val refreshToken = RefreshToken(
            id = 1L,
            token = request.refreshToken,
            user = testUser,
            expiresAt = LocalDateTime.now().plusDays(7)
        )
        
        every { jwtTokenProvider.validateToken(request.refreshToken) } returns true
        every { refreshTokenRepository.findByToken(request.refreshToken) } returns refreshToken
        every { jwtTokenProvider.createAccessToken(testUser.email, testUser.role.name) } returns "newAccessToken"
        every { jwtTokenProvider.createRefreshToken(testUser.email) } returns "newRefreshToken"
        every { refreshTokenRepository.delete(refreshToken) } just Runs
        every { refreshTokenRepository.findByUserOrderByCreatedAtDesc(testUser) } returns emptyList()
        every { refreshTokenRepository.save(any()) } returns mockk()
        every { jwtProperties.accessTokenExpiration } returns 900000L
        every { jwtProperties.refreshTokenExpiration } returns 604800000L
        
        // When
        val response = authService.refreshToken(request)
        
        // Then
        assertThat(response.accessToken).isEqualTo("newAccessToken")
        assertThat(response.refreshToken).isEqualTo("newRefreshToken")
        
        verify(exactly = 1) { refreshTokenRepository.delete(refreshToken) }
        verify(exactly = 1) { refreshTokenRepository.save(any()) }
    }
    
    @Test
    fun `logout should delete all refresh tokens for user`() {
        // Given
        val email = "test@example.com"
        
        every { userRepository.findByEmail(email) } returns testUser
        every { refreshTokenRepository.deleteByUser(testUser) } just Runs
        
        // When
        authService.logout(email)
        
        // Then
        verify(exactly = 1) { refreshTokenRepository.deleteByUser(testUser) }
    }
}