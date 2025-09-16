package com.promptdriver.service

import com.promptdriver.dto.request.UpdateUserRequest
import com.promptdriver.dto.response.UserResponse
import com.promptdriver.exception.UserNotFoundException
import com.promptdriver.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class UserService(
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(UserService::class.java)
    
    fun getCurrentUser(): UserResponse {
        val email = getCurrentUserEmail()
        logger.debug("Getting current user info for: $email")
        
        val user = userRepository.findByEmail(email)
            ?: throw UserNotFoundException("User not found with email: $email")
        
        return UserResponse(
            id = user.id,
            email = user.email,
            nickname = user.nickname,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
    
    fun updateCurrentUser(request: UpdateUserRequest): UserResponse {
        val email = getCurrentUserEmail()
        logger.debug("Updating user info for: $email")
        
        val user = userRepository.findByEmail(email)
            ?: throw UserNotFoundException("User not found with email: $email")
        
        // Check if new nickname is already taken by another user
        if (request.nickname != user.nickname && userRepository.existsByNickname(request.nickname)) {
            throw IllegalArgumentException("Nickname ${request.nickname} is already taken")
        }
        
        user.nickname = request.nickname
        val updatedUser = userRepository.save(user)
        
        logger.info("User updated successfully: ${updatedUser.email}")
        
        return UserResponse(
            id = updatedUser.id,
            email = updatedUser.email,
            nickname = updatedUser.nickname,
            createdAt = updatedUser.createdAt,
            updatedAt = updatedUser.updatedAt
        )
    }
    
    fun getUserById(userId: Long): UserResponse {
        logger.debug("Getting user by id: $userId")
        
        val user = userRepository.findById(userId).orElseThrow {
            UserNotFoundException("User not found with id: $userId")
        }
        
        return UserResponse(
            id = user.id,
            email = user.email,
            nickname = user.nickname,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt
        )
    }
    
    private fun getCurrentUserEmail(): String {
        val authentication = SecurityContextHolder.getContext().authentication
        return authentication?.name ?: throw UserNotFoundException("No authenticated user found")
    }
}