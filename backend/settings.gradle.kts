// Google's mirror of Maven Central comes first, for plugins here and for dependencies in build.gradle.kts: Maven Central
// answers 429 Too Many Requests to shared build machines such as Render's, which failed a production deploy on
// 2026-11-24 (PF-024). A plugin or library the mirror lacks still resolves from the repository listed after it.
pluginManagement {
    repositories {
        maven("https://maven-central.storage-download.googleapis.com/maven2/")
        gradlePluginPortal()
    }
}

rootProject.name = "portfolio"
