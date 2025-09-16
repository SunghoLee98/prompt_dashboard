package com.promptdriver.repository

import com.promptdriver.entity.User
import com.promptdriver.entity.UserFollow
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface UserFollowRepository : JpaRepository<UserFollow, Long> {

    fun findByFollowerAndFollowing(follower: User, following: User): UserFollow?

    fun existsByFollowerAndFollowing(follower: User, following: User): Boolean

    fun findByFollower(follower: User, pageable: Pageable): Page<UserFollow>

    fun findByFollowing(following: User, pageable: Pageable): Page<UserFollow>

    fun countByFollower(follower: User): Long

    fun countByFollowing(following: User): Long

    @Query("""
        SELECT uf FROM UserFollow uf
        JOIN FETCH uf.following
        WHERE uf.follower = :follower
        ORDER BY uf.createdAt DESC
    """)
    fun findFollowingByFollower(@Param("follower") follower: User, pageable: Pageable): Page<UserFollow>

    @Query("""
        SELECT uf FROM UserFollow uf
        JOIN FETCH uf.follower
        WHERE uf.following = :following
        ORDER BY uf.createdAt DESC
    """)
    fun findFollowersByFollowing(@Param("following") following: User, pageable: Pageable): Page<UserFollow>

    @Query("""
        SELECT CASE WHEN COUNT(uf) > 0 THEN true ELSE false END
        FROM UserFollow uf
        WHERE uf.follower.id = :followerId AND uf.following.id = :followingId
    """)
    fun existsByFollowerIdAndFollowingId(
        @Param("followerId") followerId: Long,
        @Param("followingId") followingId: Long
    ): Boolean

    @Query("""
        SELECT uf.following.id FROM UserFollow uf
        WHERE uf.follower.id = :userId
    """)
    fun findFollowingIdsByUserId(@Param("userId") userId: Long): List<Long>

    fun deleteByFollowerAndFollowing(follower: User, following: User)
}