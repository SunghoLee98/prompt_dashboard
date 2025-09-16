package com.promptdriver.service

import com.promptdriver.dto.response.FollowStatusResponse
import com.promptdriver.entity.*
import com.promptdriver.exception.*
import com.promptdriver.repository.*
import io.mockk.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.data.domain.*
import java.time.LocalDateTime
import java.util.*

class FollowServiceTest {

    private lateinit var followService: FollowService
    private lateinit var userFollowRepository: UserFollowRepository
    private lateinit var userRepository: UserRepository
    private lateinit var promptRepository: PromptRepository
    private lateinit var notificationService: NotificationService

    @BeforeEach
    fun setUp() {
        userFollowRepository = mockk()
        userRepository = mockk()
        promptRepository = mockk()
        notificationService = mockk()

        followService = FollowService(
            userFollowRepository,
            userRepository,
            promptRepository,
            notificationService
        )
    }

    @Test
    fun `should successfully follow a user`() {
        // Given
        val followerId = 1L
        val followingId = 2L

        val follower = User(
            id = followerId,
            email = "follower@test.com",
            password = "password",
            nickname = "follower"
        )

        val following = User(
            id = followingId,
            email = "following@test.com",
            password = "password",
            nickname = "following"
        )

        val userFollow = UserFollow(
            follower = follower,
            following = following
        )

        every { userRepository.findById(followerId) } returns Optional.of(follower)
        every { userRepository.findById(followingId) } returns Optional.of(following)
        every { userFollowRepository.existsByFollowerAndFollowing(follower, following) } returns false
        every { userFollowRepository.save(any()) } returns userFollow

        // When
        followService.followUser(followerId, followingId)

        // Then
        verify(exactly = 1) { userFollowRepository.save(any()) }
    }

    @Test
    fun `should throw exception when trying to follow yourself`() {
        // Given
        val userId = 1L

        // When & Then
        val exception = assertThrows<SelfFollowNotAllowedException> {
            followService.followUser(userId, userId)
        }

        assertEquals("Cannot follow yourself", exception.message)
    }

    @Test
    fun `should throw exception when already following user`() {
        // Given
        val followerId = 1L
        val followingId = 2L

        val follower = User(
            id = followerId,
            email = "follower@test.com",
            password = "password",
            nickname = "follower"
        )

        val following = User(
            id = followingId,
            email = "following@test.com",
            password = "password",
            nickname = "following"
        )

        every { userRepository.findById(followerId) } returns Optional.of(follower)
        every { userRepository.findById(followingId) } returns Optional.of(following)
        every { userFollowRepository.existsByFollowerAndFollowing(follower, following) } returns true

        // When & Then
        val exception = assertThrows<AlreadyFollowingException> {
            followService.followUser(followerId, followingId)
        }

        assertEquals("Already following this user", exception.message)
    }

    @Test
    fun `should successfully unfollow a user`() {
        // Given
        val followerId = 1L
        val followingId = 2L

        val follower = User(
            id = followerId,
            email = "follower@test.com",
            password = "password",
            nickname = "follower"
        )

        val following = User(
            id = followingId,
            email = "following@test.com",
            password = "password",
            nickname = "following"
        )

        val userFollow = UserFollow(
            follower = follower,
            following = following
        )

        every { userRepository.findById(followerId) } returns Optional.of(follower)
        every { userRepository.findById(followingId) } returns Optional.of(following)
        every { userFollowRepository.findByFollowerAndFollowing(follower, following) } returns userFollow
        every { userFollowRepository.delete(userFollow) } just Runs

        // When
        followService.unfollowUser(followerId, followingId)

        // Then
        verify(exactly = 1) { userFollowRepository.delete(userFollow) }
    }

    @Test
    fun `should throw exception when trying to unfollow user not being followed`() {
        // Given
        val followerId = 1L
        val followingId = 2L

        val follower = User(
            id = followerId,
            email = "follower@test.com",
            password = "password",
            nickname = "follower"
        )

        val following = User(
            id = followingId,
            email = "following@test.com",
            password = "password",
            nickname = "following"
        )

        every { userRepository.findById(followerId) } returns Optional.of(follower)
        every { userRepository.findById(followingId) } returns Optional.of(following)
        every { userFollowRepository.findByFollowerAndFollowing(follower, following) } returns null

        // When & Then
        val exception = assertThrows<NotFollowingException> {
            followService.unfollowUser(followerId, followingId)
        }

        assertEquals("Not following this user", exception.message)
    }

    @Test
    fun `should return correct follow status`() {
        // Given
        val requesterId = 1L
        val targetUserId = 2L

        every { userFollowRepository.existsByFollowerIdAndFollowingId(requesterId, targetUserId) } returns true
        every { userFollowRepository.existsByFollowerIdAndFollowingId(targetUserId, requesterId) } returns false

        // When
        val status = followService.getFollowStatus(requesterId, targetUserId)

        // Then
        assertTrue(status.isFollowing)
        assertFalse(status.isFollowedBy)
    }

    @Test
    fun `should return followers with pagination`() {
        // Given
        val userId = 1L
        val currentUserId = 2L
        val pageable = PageRequest.of(0, 20)

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        val follower = User(
            id = 3L,
            email = "follower@test.com",
            password = "password",
            nickname = "follower",
            followerCount = 5,
            followingCount = 10
        )

        val userFollow = UserFollow(
            follower = follower,
            following = user
        )

        val followList = listOf(userFollow)
        val page = PageImpl(followList, pageable, followList.size.toLong())

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { userFollowRepository.findFollowersByFollowing(user, pageable) } returns page
        every { promptRepository.countByAuthorAndIsPublic(follower, true) } returns 3L
        every { userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, 3L) } returns false

        // When
        val result = followService.getFollowers(userId, currentUserId, pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals("follower", result.content[0].nickname)
        assertEquals(5, result.content[0].followerCount)
        assertEquals(10, result.content[0].followingCount)
        assertEquals(3, result.content[0].promptCount)
        assertFalse(result.content[0].isFollowing)
    }

    @Test
    fun `should return following list with pagination`() {
        // Given
        val userId = 1L
        val currentUserId = 2L
        val pageable = PageRequest.of(0, 20)

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        val following = User(
            id = 3L,
            email = "following@test.com",
            password = "password",
            nickname = "following",
            followerCount = 15,
            followingCount = 20
        )

        val userFollow = UserFollow(
            follower = user,
            following = following
        )

        val followList = listOf(userFollow)
        val page = PageImpl(followList, pageable, followList.size.toLong())

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { userFollowRepository.findFollowingByFollower(user, pageable) } returns page
        every { promptRepository.countByAuthorAndIsPublic(following, true) } returns 7L
        every { userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, 3L) } returns true

        // When
        val result = followService.getFollowing(userId, currentUserId, pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals("following", result.content[0].nickname)
        assertEquals(15, result.content[0].followerCount)
        assertEquals(20, result.content[0].followingCount)
        assertEquals(7, result.content[0].promptCount)
        assertTrue(result.content[0].isFollowing)
    }

    @Test
    fun `should return empty feed when not following anyone`() {
        // Given
        val userId = 1L
        val pageable = PageRequest.of(0, 20)

        val user = User(
            id = userId,
            email = "user@test.com",
            password = "password",
            nickname = "user"
        )

        every { userRepository.findById(userId) } returns Optional.of(user)
        every { userFollowRepository.findFollowingIdsByUserId(userId) } returns emptyList()

        // When
        val result = followService.getUserFeed(userId, pageable)

        // Then
        assertTrue(result.isEmpty)
        assertEquals(0, result.totalElements)
    }

    @Test
    fun `should throw exception when follower user not found`() {
        // Given
        val followerId = 999L
        val followingId = 2L

        every { userRepository.findById(followerId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<UserNotFoundException> {
            followService.followUser(followerId, followingId)
        }

        assertEquals("Follower user not found", exception.message)
    }

    @Test
    fun `should throw exception when following user not found`() {
        // Given
        val followerId = 1L
        val followingId = 999L

        val follower = User(
            id = followerId,
            email = "follower@test.com",
            password = "password",
            nickname = "follower"
        )

        every { userRepository.findById(followerId) } returns Optional.of(follower)
        every { userRepository.findById(followingId) } returns Optional.empty()

        // When & Then
        val exception = assertThrows<UserNotFoundException> {
            followService.followUser(followerId, followingId)
        }

        assertEquals("User to follow not found", exception.message)
    }
}