package com.promptdriver.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.promptdriver.dto.response.ErrorResponse
import com.promptdriver.exception.ErrorCode
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component

@Component
class JwtAuthenticationEntryPoint(
    private val objectMapper: ObjectMapper
) : AuthenticationEntryPoint {
    
    private val logger = LoggerFactory.getLogger(JwtAuthenticationEntryPoint::class.java)
    
    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        logger.error("Unauthorized access attempt: ${authException.message}")
        
        val errorResponse = ErrorResponse(
            status = ErrorCode.UNAUTHORIZED_ACCESS.status.value(),
            error = ErrorCode.UNAUTHORIZED_ACCESS.code,
            message = "Authentication is required to access this resource",
            path = request.requestURI
        )
        
        response.status = HttpServletResponse.SC_UNAUTHORIZED
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.writer.write(objectMapper.writeValueAsString(errorResponse))
    }
}