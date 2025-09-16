package com.promptdriver.config

import org.jsoup.safety.Safelist
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SanitizationConfig {

    @Bean
    fun htmlSafeList(): Safelist {
        // Define a custom safe list that allows basic formatting tags
        // but removes potentially dangerous elements and attributes
        return Safelist.relaxed()
            // Remove dangerous attributes
            .removeAttributes("*", "onclick", "onload", "onerror", "onmouseover", "onfocus", "onblur")
            // Remove dangerous protocols from links
            .removeProtocols("a", "href", "javascript", "data")
            .removeProtocols("img", "src", "javascript", "data")
    }
}