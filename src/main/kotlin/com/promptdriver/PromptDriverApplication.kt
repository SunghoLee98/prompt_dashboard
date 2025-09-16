package com.promptdriver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
@SpringBootApplication
@ConfigurationPropertiesScan
class PromptDriverApplication

fun main(args: Array<String>) {
    runApplication<PromptDriverApplication>(*args)
}