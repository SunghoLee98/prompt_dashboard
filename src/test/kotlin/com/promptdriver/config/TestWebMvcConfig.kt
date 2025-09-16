package com.promptdriver.config

import com.promptdriver.security.JwtAuthenticationFilter
import com.promptdriver.security.JwtTokenProvider
import com.promptdriver.security.CustomUserDetailsService
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Bean
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

@TestConfiguration
class TestWebMvcConfig {
    
    @MockBean
    lateinit var jwtTokenProvider: JwtTokenProvider
    
    @MockBean
    lateinit var jwtAuthenticationFilter: JwtAuthenticationFilter
    
    @MockBean
    lateinit var customUserDetailsService: CustomUserDetailsService
    
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
    
    @Bean
    fun jwtProperties(): JwtProperties {
        return JwtProperties(
            secret = "testSecretKeyForTestingPurposesOnlyThisShouldBeAtLeast256BitsLongForHS256Algorithm",
            accessTokenExpiration = 900000,
            refreshTokenExpiration = 604800000
        )
    }
}