# moovmii kiosk shell (Android)

A native Android app that turns a stock Android tablet into a locked-down moovmii kiosk:

1. Tablet boots directly into a **native WiFi setup screen** (dark moovmii styling: network list, signal strength, password entry).
2. The moment the connection validates against the internet, the shell hands off to the hosted web app (`APP_URL`) rendered by **GeckoView** — a current Mozilla browser engine bundled inside the APK.
3. If connectivity drops, the shell falls back to the WiFi screen automatically.

The app runs as **Device Owner** in **lock task (kiosk) mode**: it is the home screen, back/home/recents are dead ends, and the user can never reach Android. Device Owner status is also what legally permits programmatic WiFi join on Android 10+ (normal apps are blocked from `WifiManager.addNetwork`; Device Owner apps are exempt).

## Why GeckoView instead of the system WebView

The initial hardware batch runs Android 7 with a Chrome 58-era WebView that the vendor cannot update. That engine can't render the web app (Tailwind CSS v4 requires Chrome 111+), and Android 7.0's certificate store predates ISRG Root X1, so even HTTPS can fail. GeckoView solves both permanently:

- Ships a **modern engine inside the APK** — rendering is identical on every unit, forever, regardless of what WebView any vendor ships.
- Brings **its own certificate root store**, so old-Android TLS problems disappear.
- Runs on Android 5.0+.

Costs to know about: the APK is ~70–100MB per CPU architecture, the engine uses ~100–200MB more RAM than a shared system WebView (fine on 2GB+ tablets), and engine updates ship via your APK updates rather than the system.

## Project layout

- `app/src/main/java/com/moovmii/kiosk/MainActivity.kt` — GeckoView host, connectivity watcher, Device Owner lockdown (lock task, persistent home, self-granted location).
- `app/src/main/java/com/moovmii/kiosk/WifiSetupView.kt` — native WiFi setup UI (list → password → connecting).
- `app/src/main/java/com/moovmii/kiosk/WifiController.kt` — WifiManager scan/join (Device Owner APIs).
- `provisioning/qr-payload.json` — template for factory QR provisioning.

## Pin the GeckoView version

`app/build.gradle.kts` uses `org.mozilla.geckoview:geckoview:+` so the first Gradle sync grabs the newest release. Before shipping, pin it: check the resolved version (Android Studio → External Libraries, or `gradle app:dependencies | grep geckoview`) and replace the `+` with it. Browse available versions at <https://maven.mozilla.org/maven2/org/mozilla/geckoview/geckoview/>.

## Configure the app URL

The production URL defaults to `https://app.moovmii.com`. Override at build time:

```
./gradlew assembleRelease -PmoovmiiAppUrl=https://staging.moovmii.com
```

## Build

Open `android-shell/` in Android Studio (it will generate the Gradle wrapper), or with a local Gradle 8.7+ install:

```
cd android-shell
gradle assembleDebug
```

## Development install (no factory reset)

Sideload and claim Device Owner via adb — **only works on a device with no Google account added yet**:

```
adb install app/build/outputs/apk/debug/app-debug.apk
adb shell dpm set-device-owner com.moovmii.kiosk/.KioskDeviceAdminReceiver
```

Reboot; the tablet now boots straight into the kiosk. To undo during development:

```
adb shell dpm remove-active-admin com.moovmii.kiosk/.KioskDeviceAdminReceiver
```

(If `remove-active-admin` is refused, factory reset the device.)

Without Device Owner (plain `adb install`, tap the launcher icon) the app still runs for UI work, but WiFi join and lockdown are inert — Android blocks them for normal apps.

## Debugging the web app on a tablet

Debug builds enable Gecko remote debugging. With the tablet on USB:

1. Open desktop **Firefox** → `about:debugging` → This Firefox / Setup → enable USB devices.
2. The tablet appears in the sidebar; click **Connect**, then **Inspect** on the moovmii tab for full DevTools (console, network, elements).

## Factory provisioning (production)

Per tablet, in the warehouse:

1. Factory reset / first boot.
2. On the welcome screen, tap anywhere **6 times** — Android opens the QR provisioning flow.
3. Scan a QR code generated from `provisioning/qr-payload.json` (fill in the real APK download URL and signature checksum first; generate the checksum with `apksigner` — see below).
4. Android downloads the APK, sets it as Device Owner, and the device boots into the moovmii experience. Done — the customer never sees Android.

Note: the APK is large (GeckoView is bundled), so provisioning downloads take a few minutes on slow WiFi.

Signature checksum for the QR payload:

```
apksigner verify --print-certs app-release.apk
# take the SHA-256 digest, convert to base64url:
echo <hex-digest> | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
```

## Known limitations / next steps

- **APK updates**: the web app updates itself (it's hosted), but shell/engine updates need a mechanism — simplest is an MDM (Esper, Scalefusion) or a self-update check in the shell. Higher priority now that the browser engine ships in the APK.
- **WEP / enterprise (802.1x) networks** are not supported; WPA/WPA2/WPA3-personal and open networks are.
- **Captive portals** (hotel-style login pages) keep the network from validating, so the WiFi screen will report the join as failed after 25s.
- Consider a **scheduled nightly reboot** (`DevicePolicyManager.reboot`) for long-term stability.
- Optional: **ABI splits** in Gradle to ship smaller per-architecture APKs instead of one fat APK.
