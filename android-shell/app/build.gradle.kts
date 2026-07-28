plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.moovmii.kiosk"
    compileSdk = 34

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
