package com.huygialy.portfolio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

// The API has no users or logins, so Spring Security's generated in-memory user is never created.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class PortfolioApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioApplication.class, args);
    }
}
