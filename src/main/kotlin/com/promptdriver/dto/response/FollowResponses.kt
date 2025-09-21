package com.promptdriver.dto.response

import java.time.LocalDateTime

data class FollowStatusResponse(
    val isFollowing: Boolean,
    val isFollowedBy: Boolean
)

data class FollowerResponse(
    val id: Long,
    val nickname: String,
    val followerCount: Int,
    val followingCount: Int,
    val promptCount: Int,
    val isFollowing: Boolean,
    val followedAt: LocalDateTime
)

data class FollowingResponse(
    val id: Long,
    val nickname: String,
    val followerCount: Int,
    val followingCount: Int,
    val promptCount: Int,
    val isFollowing: Boolean,
    val followedAt: LocalDateTime
)

data class FollowUserResponse(
    val id: Long,
    val nickname: String,
    val followerCount: Int,
    val followingCount: Int,
    val isFollowing: Boolean = false
)