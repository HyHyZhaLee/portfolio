package com.huygialy.portfolio.visit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class VisitValidatorTest {

    static Stream<Arguments> refTags() {
        return Stream.of(
                arguments("company-a", Optional.of("company-a")),
                arguments("a".repeat(64), Optional.of("a".repeat(64))),
                arguments("Company-A", Optional.empty()),
                arguments("a".repeat(65), Optional.empty()),
                arguments("a_b", Optional.empty()),
                arguments("", Optional.empty()),
                arguments(null, Optional.empty()));
    }

    @ParameterizedTest
    @MethodSource("refTags")
    void refTagKeepsOnlyLowercaseLettersDigitsAndHyphensUpTo64(String raw, Optional<String> expected) {
        assertThat(VisitValidator.refTag(raw)).isEqualTo(expected);
    }

    static Stream<Arguments> referrers() {
        return Stream.of(
                arguments("https://www.LinkedIn.com/feed/?x=1", Optional.of("www.linkedin.com")),
                arguments("http://example.com", Optional.of("example.com")),
                arguments("https://" + ("a".repeat(60) + ".").repeat(5) + "com/", Optional.empty()),
                arguments("https://under_score.example/", Optional.empty()),
                arguments("javascript:alert(1)", Optional.empty()),
                arguments("ftp://example.com/file", Optional.empty()),
                arguments("not a url", Optional.empty()),
                arguments("", Optional.empty()),
                arguments(null, Optional.empty()));
    }

    @ParameterizedTest
    @MethodSource("referrers")
    void referrerHostKeepsOnlyTheLowercasedHostOfAnHttpUrl(String raw, Optional<String> expected) {
        assertThat(VisitValidator.referrerHost(raw)).isEqualTo(expected);
    }
}
