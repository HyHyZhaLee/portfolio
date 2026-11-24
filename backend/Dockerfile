# Backend image for Render Free (PF-004 P14; implementation plan §5.6). Build: docker build -t portfolio-backend backend
# Tags are pinned (security rules): the newest Temurin 21.0.13 images at least a week old when PF-004 was built.

# ---- build ----
FROM eclipse-temurin:21.0.13_9-jdk AS build
WORKDIR /app
COPY gradle/ gradle/
COPY gradlew settings.gradle.kts build.gradle.kts ./
# Download the Gradle distribution and every jar the build needs in their own layer, so a source change reuses it and
# downloads nothing; the build itself then runs offline (PF-024). `dependencies` alone fetched only the POM files.
RUN ./gradlew --no-daemon -q downloadDependencies
COPY src/ src/
RUN ./gradlew --no-daemon -q --offline bootJar

# ---- run ----
FROM eclipse-temurin:21.0.13_9-jre
WORKDIR /app
RUN useradd --system --uid 10001 app
COPY --from=build /app/build/libs/app.jar app.jar
USER app
# Render Free has 512 MB of RAM and 0.1 CPU: cap the heap, use a light GC, small stacks, and faster startup.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
