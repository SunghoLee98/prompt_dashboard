package com.promptdriver.service

import com.promptdriver.dto.response.*
import com.promptdriver.entity.*
import com.promptdriver.exception.*
import com.promptdriver.repository.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class FollowService(
    private val userFollowRepository: UserFollowRepository,
    private val userRepository: UserRepository,
    private val promptRepository: PromptRepository,
    private val notificationService: NotificationService
) {

    /**
     * Follow a user
     */
    fun followUser(followerId: Long, followingId: Long): Unit {
        // Check if trying to follow self
        if (followerId == followingId) {
            throw SelfFollowNotAllowedException()
        }

        val follower = userRepository.findById(followerId)
            .orElseThrow { UserNotFoundException("Follower user not found") }

        val following = userRepository.findById(followingId)
            .orElseThrow { UserNotFoundException("User to follow not found") }

        // Check if already following
        if (userFollowRepository.existsByFollowerAndFollowing(follower, following)) {
            throw AlreadyFollowingException()
        }

        // Create follow relationship
        val userFollow = UserFollow(
            follower = follower,
            following = following
        )

        userFollowRepository.save(userFollow)

        // The database trigger will handle updating follow counts and creating notification
    }

    /**
     * Unfollow a user
     */
    fun unfollowUser(followerId: Long, followingId: Long): Unit {
        val follower = userRepository.findById(followerId)
            .orElseThrow { UserNotFoundException("Follower user not found") }

        val following = userRepository.findById(followingId)
            .orElseThrow { UserNotFoundException("User to unfollow not found") }

        val userFollow = userFollowRepository.findByFollowerAndFollowing(follower, following)
            ?: throw NotFollowingException()

        userFollowRepository.delete(userFollow)

        // The database trigger will handle updating follow counts
    }

    /**
     * Get follow status between two users
     */
    @Transactional(readOnly = true)
    fun getFollowStatus(requesterId: Long, targetUserId: Long): FollowStatusResponse {
        val isFollowing = userFollowRepository.existsByFollowerIdAndFollowingId(requesterId, targetUserId)
        val isFollowedBy = userFollowRepository.existsByFollowerIdAndFollowingId(targetUserId, requesterId)

        return FollowStatusResponse(
            isFollowing = isFollowing,
            isFollowedBy = isFollowedBy
        )
    }

    /**
     * Get followers of a user with pagination
     */
    @Transactional(readOnly = true)
    fun getFollowers(userId: Long, currentUserId: Long?, pageable: Pageable): Page<FollowerResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException() }

        val followersPage = userFollowRepository.findFollowersByFollowing(user, pageable)

        return followersPage.map { follow ->
            val follower = follow.follower
            val promptCount = promptRepository.countByAuthorAndIsPublic(follower, true).toInt()
            val isFollowing = currentUserId?.let {
                userFollowRepository.existsByFollowerIdAndFollowingId(it, follower.id)
            } ?: false

            FollowerResponse(
                id = follower.id,
                nickname = follower.nickname,
                followerCount = follower.followerCount,
                followingCount = follower.followingCount,
                promptCount = promptCount,
                isFollowing = isFollowing,
                followedAt = follow.createdAt
            )
        }
    }

    /**
     * Get users that a user is following with pagination
     */
    @Transactional(readOnly = true)
    fun getFollowing(userId: Long, currentUserId: Long?, pageable: Pageable): Page<FollowingResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException() }

        val followingPage = userFollowRepository.findFollowingByFollower(user, pageable)

        return followingPage.map { follow ->
            val following = follow.following
            val promptCount = promptRepository.countByAuthorAndIsPublic(following, true).toInt()
            val isFollowing = currentUserId?.let {
                userFollowRepository.existsByFollowerIdAndFollowingId(it, following.id)
            } ?: false

            FollowingResponse(
                id = following.id,
                nickname = following.nickname,
                followerCount = following.followerCount,
                followingCount = following.followingCount,
                promptCount = promptCount,
                isFollowing = isFollowing,
                followedAt = follow.createdAt
            )
        }
    }

    /**
     * Get feed from followed users
     */
    @Transactional(readOnly = true)
    fun getUserFeed(userId: Long, pageable: Pageable): Page<PromptSummaryResponse> {
        val user = userRepository.findById(userId)
            .orElseThrow { UserNotFoundException() }

        // Get list of users that the current user is following
        val followingIds = userFollowRepository.findFollowingIdsByUserId(userId)

        if (followingIds.isEmpty()) {
            return Page.empty(pageable)
        }

        // Get prompts from followed users
        val prompts = promptRepository.findByAuthorIdInAndIsPublicOrderByCreatedAtDesc(
            followingIds,
            true,
            pageable
        )

        return prompts.map { prompt ->
            val isLiked = prompt.likes.any { it.user.id == userId }
            val userRating = prompt.ratings.find { it.user.id == userId }?.rating

            PromptSummaryResponse(
                id = prompt.id,
                title = prompt.title,
                description = prompt.description,
                category = prompt.category,
                tags = prompt.tags,
                author = AuthorResponse(
                    id = prompt.author.id,
                    nickname = prompt.author.nickname
                ),
                viewCount = prompt.viewCount,
                likeCount = prompt.likeCount,
                isLiked = isLiked,
                averageRating = prompt.averageRating,
                ratingCount = prompt.ratingCount,
                userRating = userRating,
                bookmarkCount = prompt.bookmarkCount,
                isPublic = prompt.isPublic,
                createdAt = prompt.createdAt,
                updatedAt = prompt.updatedAt
            )
        }
    }
}