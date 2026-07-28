# moovmii kiosk shell (Android)

A thin native Android app that turns a stock Android tablet into a locked-down moovmii kiosk:

1. Tablet boots directly into a **WiFi setup screen** (bundled locally, styled to match the moovmii web app's WiFi mock).
2. WiFi scanning/joining happens natively via a JavaScript bridge (`MoovmiiNative`).
3. The moment the connection validates against the internet, the WebView **hands off to the hosted web app** (`APP_URL`).
4. If connectivity drops, the shell falls back to the WiFi screen automatically.

The app runs as **Device Owner** in **lock task (kiosk) mode**: it is the home screen, back/home/recents are dead ends, and the user can never reach Android. Device Owner status is also what legally permits programmatic WiFi join on Android 10+ (normal apps are blocked from `WifiManager.addNetwork`; Device Owner apps are exempt).

## Project layout

- `app/src/main/java/com/moovmii/kiosk/MainActivity.kt` — fullscreen WebView, connectivity watcher, Device Owner lockdown (lock task, persistent home, self-granted location permission).
- `app/src/main/java/com/moovmii/kiosk/WifiBridge.kt` — `MoovmiiNative` JS bridge: `scanNetworks()`, `connect(ssid, password)`, `isOnline()`.
- `app/src/main/assets/wifi-setup.html` — the WiFi selection UI (self-contained; also previewable in a desktop browser with demo data).
- `provisioning/qr-payload.json` — template for factory QR provisioning.

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

## Factory provisioning (production)

Per tablet, in the warehouse:

1. Factory reset / first boot.
2. On the welcome screen, tap anywhere **6 times** — Android opens the QR provisioning flow.
3. Scan a QR code generated from `provisioning/qr-payload.json` (fill in the real APK download URL and signature checksum first; generate the checksum with `apksigner` — see below).
4. Android downloads the APK, sets it as Device Owner, and the device boots into the moovmii experience. Done — the customer never sees Android.

Signature checksum for the QR payload:

```
apksigner verify --print-certs app-release.apk
# take the SHA-256 digest, convert to base64url:
echo <hex-digest> | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
```

## Known limitations / next steps

- **App updates**: the web app updates itself (it's hosted), but shell APK updates need a mechanism — simplest is an MDM (Esper, Scalefusion) or a self-update check in the shell.
- **WEP / enterprise (802.1x) networks** are not supported by the bridge; WPA/WPA2/WPA3-personal and open networks are.
- **Captive portals** (hotel-style login pages) will keep `NET_CAPABILITY_VALIDATED` false, so the shell won't hand off; the WiFi page will report the join as failed after 25s.
- Consider a **scheduled nightly reboot** (`DevicePolicyManager.reboot`) for long-term stability.
