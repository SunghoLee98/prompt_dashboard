package com.promptdriver.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.promptdriver.dto.response.ErrorResponse
import com.promptdriver.exception.ErrorCode
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component

@Component
class JwtAccessDeniedHandler(
    private val objectMapper: ObjectMapper
) : AccessDeniedHandler {
    
    private val logger = LoggerFactory.getLogger(JwtAccessDeniedHandler::class.java)
    
    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException
    ) {
        logger.error("Access denied: ${accessDeniedException.message}")
        
        val errorResponse = ErrorResponse(
            status = ErrorCode.FORBIDDEN.status.value(),
            error = ErrorCode.FORBIDDEN.code,
            message = "You do not have permission to access this resource",
            path = request.requestURI
        )
        
        response.status = HttpServletResponse.SC_FORBIDDEN
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.writer.write(objectMapper.writeValueAsString(errorResponse))
    }
}