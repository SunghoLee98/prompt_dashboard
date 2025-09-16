package com.promptdriver.service

import com.promptdriver.dto.request.UpdateUserRequest
import com.promptdriver.entity.User
import com.promptdriver.entity.UserRole
import com.promptdriver.exception.UserNotFoundException
import com.promptdriver.repository.UserRepository
import io.mockk.*
import io.mockk.impl.annotations.InjectMockKs
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import java.time.LocalDateTime
import java.util.*

@ExtendWith(MockKExtension::class)
class UserServiceTest {
    
    @MockK
    private lateinit var userRepository: UserRepository
    
    @InjectMockKs
    private lateinit var userService: UserService
    
    @MockK
    private lateinit var authentication: Authentication
    
    @MockK
    private lateinit var securityContext: SecurityContext
    
    private lateinit var testUser: User
    
    @BeforeEach
    fun setup() {
        testUser = User(
            id = 1L,
            email = "test@example.com",
            password = "encodedPassword",
            nickname = "testuser",
            role = UserRole.USER,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        
        SecurityContextHolder.setContext(securityContext)
        every { securityContext.authentication } returns authentication
        every { authentication.name } returns testUser.email
    }
    
    @Test
    fun `getCurrentUser should return current user info`() {
        // Given
        every { userRepository.findByEmail(testUser.email) } returns testUser
        
        // When
        val response = userService.getCurrentUser()
        
        // Then
        assertThat(response.id).isEqualTo(testUser.id)
        assertThat(response.email).isEqualTo(testUser.email)
        assertThat(response.nickname).isEqualTo(testUser.nickname)
    }
    
    @Test
    fun `getCurrentUser should throw exception when user not found`() {
        // Given
        every { userRepository.findByEmail(testUser.email) } returns null
        
        // When/Then
        assertThrows<UserNotFoundException> {
            userService.getCurrentUser()
        }
    }
    
    @Test
    fun `updateCurrentUser should update nickname successfully`() {
        // Given
        val request = UpdateUserRequest(nickname = "newnickname")
        val updatedUser = testUser.copy(nickname = request.nickname)
        
        every { userRepository.findByEmail(testUser.email) } returns testUser
        every { userRepository.existsByNickname(request.nickname) } returns false
        every { userRepository.save(any()) } returns updatedUser
        
        // When
        val response = userService.updateCurrentUser(request)
        
        // Then
        assertThat(response.nickname).isEqualTo(request.nickname)
        verify(exactly = 1) { userRepository.save(any()) }
    }
    
    @Test
    fun `updateCurrentUser should throw exception when nickname already taken`() {
        // Given
        val request = UpdateUserRequest(nickname = "takennickname")
        
        every { userRepository.findByEmail(testUser.email) } returns testUser
        every { userRepository.existsByNickname(request.nickname) } returns true
        
        // When/Then
        assertThrows<IllegalArgumentException> {
            userService.updateCurrentUser(request)
        }
        
        verify(exactly = 0) { userRepository.save(any()) }
    }
    
    @Test
    fun `getUserById should return user when found`() {
        // Given
        val userId = 1L
        
        every { userRepository.findById(userId) } returns Optional.of(testUser)
        
        // When
        val response = userService.getUserById(userId)
        
        // Then
        assertThat(response.id).isEqualTo(testUser.id)
        assertThat(response.email).isEqualTo(testUser.email)
        assertThat(response.nickname).isEqualTo(testUser.nickname)
    }
    
    @Test
    fun `getUserById should throw exception when user not found`() {
        // Given
        val userId = 999L
        
        every { userRepository.findById(userId) } returns Optional.empty()
        
        // When/Then
        assertThrows<UserNotFoundException> {
            userService.getUserById(userId)
        }
    }
}