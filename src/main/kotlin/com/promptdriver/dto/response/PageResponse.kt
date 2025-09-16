package com.promptdriver.dto.response

data class PageResponse<T>(
    val content: List<T>,
    val totalElements: Long,
    val totalPages: Int,
    val page: Int,
    val size: Int,
    val first: Boolean,
    val last: Boolean
)