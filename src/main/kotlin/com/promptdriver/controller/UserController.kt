package com.promptdriver.controller

import com.promptdriver.dto.request.UpdateUserRequest
import com.promptdriver.dto.response.UserResponse
import com.promptdriver.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "User management APIs")
@SecurityRequirement(name = "bearer-jwt")
class UserController(
    private val userService: UserService
) {
    
    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun getCurrentUser(): ResponseEntity<UserResponse> {
        val response = userService.getCurrentUser()
        return ResponseEntity.ok(response)
    }
    
    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "User profile updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid input data"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun updateCurrentUser(
        @Valid @RequestBody request: UpdateUserRequest
    ): ResponseEntity<UserResponse> {
        val response = userService.updateCurrentUser(request)
        return ResponseEntity.ok(response)
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "User retrieved successfully"),
        ApiResponse(responseCode = "404", description = "User not found")
    )
    fun getUserById(
        @PathVariable id: Long
    ): ResponseEntity<UserResponse> {
        val response = userService.getUserById(id)
        return ResponseEntity.ok(response)
    }
}