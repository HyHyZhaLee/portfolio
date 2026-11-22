package com.huygialy.portfolio;

import com.huygialy.portfolio.support.TestcontainersConfiguration;
import org.springframework.boot.SpringApplication;

/** Entry point for {@code bootTestRun}: the application against a Testcontainers PostgreSQL, no compose needed. */
public class TestPortfolioApplication {

    public static void main(String[] args) {
        SpringApplication.from(PortfolioApplication::main)
                .with(TestcontainersConfiguration.class)
                .run(args);
    }
}
