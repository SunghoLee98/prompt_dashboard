package com.promptdriver.repository

import com.promptdriver.entity.Prompt
import com.promptdriver.entity.PromptLike
import com.promptdriver.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface PromptLikeRepository : JpaRepository<PromptLike, Long> {
    fun findByUserAndPrompt(user: User, prompt: Prompt): PromptLike?
    fun existsByUserAndPrompt(user: User, prompt: Prompt): Boolean
    fun deleteByUserAndPrompt(user: User, prompt: Prompt)
    fun countByPrompt(prompt: Prompt): Long
}