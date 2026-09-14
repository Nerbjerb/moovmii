plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.moovmii.kiosk"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.moovmii.kiosk"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        // The hosted moovmii web app the shell hands off to once WiFi validates.
        // Override per-environment: -PmoovmiiAppUrl=https://staging.moovmii.com
        val appUrl = (project.findProperty("moovmiiAppUrl") as String?) ?: "https://app.moovmii.com"
        buildConfigField("String", "APP_URL", "\"$appUrl\"")
    }

    buildFeatures {
        buildConfig = true
    }

    // One APK per CPU architecture — GeckoView's native libs are large, and a
    // tablet only needs its own ABI (the fleet is ARM; no x86 needed)
    splits {
        abi {
            isEnable = true
            reset()
            include("armeabi-v7a", "arm64-v8a")
            isUniversalApk = false
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // GeckoView: bundled Mozilla engine so the kiosk renders identically on every
    // tablet regardless of the (possibly ancient, non-updatable) system WebView.
    // Pinned to the 140 ESR line — the last major line supporting Android 5-7,
    // which the initial hardware batch (Android 7) requires. Newer lines (142+)
    // dropped pre-Android-8 support; do not bump past 140 while Android 7
    // tablets are in the fleet.
    implementation("org.mozilla.geckoview:geckoview:140.0.20250707120347")
}
