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

dependencies {
    // GeckoView: bundled Mozilla engine so the kiosk renders identically on every
    // tablet regardless of the (possibly ancient, non-updatable) system WebView.
    // "+" grabs the newest release for first sync — pin the resolved version before
    // shipping (see README; available versions at
    // https://maven.mozilla.org/maven2/org/mozilla/geckoview/geckoview/)
    implementation("org.mozilla.geckoview:geckoview:+")
}
