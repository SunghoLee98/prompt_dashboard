package com.promptdriver.exception

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.BAD_REQUEST)
class InvalidRatingException(message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.CONFLICT)
class RatingAlreadyExistsException(message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.NOT_FOUND)
class RatingNotFoundException(message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.FORBIDDEN)
class SelfRatingException(message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.FORBIDDEN)
class UnauthorizedRatingAccessException(message: String) : RuntimeException(message)