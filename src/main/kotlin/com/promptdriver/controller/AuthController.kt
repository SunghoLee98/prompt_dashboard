package com.promptdriver.controller

import com.promptdriver.dto.request.LoginRequest
import com.promptdriver.dto.request.RefreshTokenRequest
import com.promptdriver.dto.request.RegisterRequest
import com.promptdriver.dto.response.AuthResponse
import com.promptdriver.dto.response.UserRegistrationResponse
import com.promptdriver.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication management APIs")
class AuthController(
    private val authService: AuthService
) {
    
    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "User registered successfully"),
        ApiResponse(responseCode = "400", description = "Invalid input data"),
        ApiResponse(responseCode = "409", description = "User already exists")
    )
    fun register(
        @Valid @RequestBody request: RegisterRequest
    ): ResponseEntity<UserRegistrationResponse> {
        val response = authService.register(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }
    
    @PostMapping("/login")
    @Operation(summary = "User login")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Login successful"),
        ApiResponse(responseCode = "401", description = "Invalid credentials"),
        ApiResponse(responseCode = "404", description = "User not found")
    )
    fun login(
        @Valid @RequestBody request: LoginRequest
    ): ResponseEntity<AuthResponse> {
        val response = authService.login(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
        ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    )
    fun refreshToken(
        @Valid @RequestBody request: RefreshTokenRequest
    ): ResponseEntity<AuthResponse> {
        val response = authService.refreshToken(request)
        return ResponseEntity.ok(response)
    }
    
    @PostMapping("/logout")
    @Operation(summary = "User logout")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Logout successful"),
        ApiResponse(responseCode = "401", description = "Unauthorized")
    )
    fun logout(
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<Void> {
        authService.logout(userDetails.username)
        return ResponseEntity.noContent().build()
    }
}