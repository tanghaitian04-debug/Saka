plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.chaquo.python")
}
android {
    namespace = "com.tang.video"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.tang.video.downloader"
        minSdk = 29
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        ndk { abiFilters += listOf("arm64-v8a", "x86_64") }
    }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    packaging { jniLibs { useLegacyPackaging = true; keepDebugSymbols += "**/libvd*.so" } }
    testOptions { unitTests.isReturnDefaultValues = true; animationsDisabled = true }
}
chaquopy {
    defaultConfig {
        version = "3.13"
        pip {
            install("yt-dlp==2026.8.19")
            install("yt-dlp-ejs==0.8.0")
            install("requests==2.32.5")
            install("certifi==2026.7.22")
        }
    }
}
dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.05.01"))
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.1")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.1")
    implementation("androidx.work:work-runtime-ktx:2.10.1")
    implementation("io.coil-kt:coil-compose:2.7.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test:runner:1.6.2")
}
val verifyNative by tasks.registering {
    doLast {
        listOf("arm64-v8a", "x86_64").forEach { abi ->
            listOf("libvdffmpeg.so", "libvdqjs.so").forEach { name ->
                check(file("src/main/jniLibs/$abi/$name").isFile) { "Missing Android binary: $abi/$name. Run scripts/build-native.sh first." }
            }
        }
    }
}
tasks.matching { it.name == "preBuild" }.configureEach { dependsOn(verifyNative) }
