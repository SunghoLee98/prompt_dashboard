package com.promptdriver.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.promptdriver.dto.request.LoginRequest
import com.promptdriver.dto.request.RegisterRequest
import com.promptdriver.dto.response.AuthResponse
import com.promptdriver.dto.response.UserRegistrationResponse
import com.promptdriver.service.AuthService
import com.promptdriver.exception.UserAlreadyExistsException
import com.promptdriver.exception.InvalidCredentialsException
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.LocalDateTime

@WebMvcTest(AuthController::class)
@AutoConfigureMockMvc(addFilters = false)
@Import(AuthControllerTest.TestConfig::class)
class AuthControllerTest {
    
    @Autowired
    private lateinit var mockMvc: MockMvc
    
    @Autowired
    private lateinit var authService: AuthService
    
    @Autowired
    private lateinit var objectMapper: ObjectMapper
    
    @TestConfiguration
    class TestConfig {
        @Bean
        fun authService(): AuthService = mockk()
        
        @Bean
        fun objectMapper(): ObjectMapper = ObjectMapper().findAndRegisterModules()
    }
    
    @Test
    fun `register should create new user successfully`() {
        // Given
        val request = RegisterRequest(
            email = "test@example.com",
            password = "Password123",
            nickname = "testuser"
        )
        
        val response = UserRegistrationResponse(
            id = 1L,
            email = request.email,
            nickname = request.nickname,
            createdAt = LocalDateTime.now()
        )
        
        every { authService.register(request) } returns response
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.email").value(request.email))
            .andExpect(jsonPath("$.nickname").value(request.nickname))
        
        verify(exactly = 1) { authService.register(request) }
    }
    
    @Test
    fun `register should return 409 when user already exists`() {
        // Given
        val request = RegisterRequest(
            email = "existing@example.com",
            password = "Password123",
            nickname = "existinguser"
        )
        
        every { authService.register(request) } throws UserAlreadyExistsException("User already exists")
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isConflict)
    }
    
    @Test
    fun `login should return tokens for valid credentials`() {
        // Given
        val request = LoginRequest(
            email = "test@example.com",
            password = "password"
        )
        
        val response = AuthResponse(
            accessToken = "accessToken",
            refreshToken = "refreshToken",
            tokenType = "Bearer",
            expiresIn = 900
        )
        
        every { authService.login(request) } returns response
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.accessToken").value(response.accessToken))
            .andExpect(jsonPath("$.refreshToken").value(response.refreshToken))
            .andExpect(jsonPath("$.tokenType").value(response.tokenType))
        
        verify(exactly = 1) { authService.login(request) }
    }
    
    @Test
    fun `login should return 401 for invalid credentials`() {
        // Given
        val request = LoginRequest(
            email = "test@example.com",
            password = "wrongpassword"
        )
        
        every { authService.login(request) } throws InvalidCredentialsException()
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isUnauthorized)
    }
    
    @Test
    @WithMockUser(username = "test@example.com")
    fun `logout should return 204 No Content`() {
        // Given
        every { authService.logout("test@example.com") } returns Unit
        
        // When & Then
        mockMvc.perform(
            post("/api/v1/auth/logout")
        )
            .andExpect(status().isNoContent)
        
        verify(exactly = 1) { authService.logout("test@example.com") }
    }
}