plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "it.menuto.orders"
    compileSdk = 34

    defaultConfig {
        applicationId = "it.menuto.orders"
        minSdk = 24
        targetSdk = 34
        versionCode = (System.getenv("VERSION_CODE") ?: "1").toInt()
        versionName = "0.1.${System.getenv("VERSION_CODE") ?: "1"}"
    }

    // Test-phase signing key kept in the repo so every build installs over the previous one.
    // Replace it with a private release key (stored as a GitHub secret) before publishing on Google Play.
    signingConfigs {
        create("dev") {
            storeFile = file("menuto-dev.keystore")
            storePassword = "menuto-dev"
            keyAlias = "menuto"
            keyPassword = "menuto-dev"
        }
    }
    buildTypes {
        debug { signingConfig = signingConfigs.getByName("dev") }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("dev")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.11.0")
}
