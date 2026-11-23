package com.huygialy.portfolio.support;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.junit.jupiter.api.Tag;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestConstructor;

/**
 * Marks an integration test: the full application on a random port against a Testcontainers PostgreSQL, with WireMock
 * standing in for external providers ({@link WireMockSupport}), called through {@code RestTestClient}. Every class uses this annotation unchanged, so they all share one Spring context. It runs in
 * the {@code testIT} task with the {@code test} profile ({@code application-test.yml}). Dependencies arrive through the test class's constructor. Never add {@code @MockitoBean} to an
 * integration test (KNOWN-BE-008).
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Tag("integration")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@Import({TestcontainersConfiguration.class, WireMockSupport.class})
@ActiveProfiles("test")
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
public @interface IntegrationTest {}
