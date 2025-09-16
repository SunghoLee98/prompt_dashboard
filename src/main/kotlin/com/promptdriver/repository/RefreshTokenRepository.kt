package com.promptdriver.repository

import com.promptdriver.entity.RefreshToken
import com.promptdriver.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.Optional

@Repository
interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {
    fun findByToken(token: String): RefreshToken?
    fun deleteByUser(user: User)
    fun deleteByToken(token: String)
    
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    fun deleteExpiredTokens(@Param("now") now: LocalDateTime)
    
    fun findAllByUser(user: User): List<RefreshToken>
    fun findByUserOrderByCreatedAtDesc(user: User): List<RefreshToken>
}