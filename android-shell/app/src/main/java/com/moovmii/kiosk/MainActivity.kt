package com.moovmii.kiosk

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView

/**
 * moovmii kiosk shell.
 *
 * Runs as Device Owner in lock task mode: this activity IS the home screen and the
 * only thing the tablet can do. Boots into the native WiFi setup view; once a
 * network connection validates against the internet, hands off to the hosted web
 * app rendered by GeckoView — a bundled, modern Mozilla engine, so old or broken
 * system WebViews (and their outdated certificate stores) never matter.
 * If connectivity is lost, falls back to the WiFi setup view automatically.
 */
class MainActivity : Activity() {

    companion object {
        // GeckoRuntime must be created exactly once per process
        private var geckoRuntime: GeckoRuntime? = null
        private const val REQ_LOCATION = 1001
    }

    // WiFi scanning requires the Location permission. Device Owner installs
    // self-grant it; plain installs (the beta units) ask the user once.
    private fun hasLocationPermission(): Boolean =
        checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED

    private fun requestLocationPermission() {
        requestPermissions(arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION), REQ_LOCATION)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_LOCATION && wifiSetupView.visibility == View.VISIBLE) {
            wifiSetupView.startScanning()
        }
    }

    private lateinit var geckoView: GeckoView
    private lateinit var session: GeckoSession
    private lateinit var wifiSetupView: WifiSetupView
    private var showingApp = false
    private var appLoaded = false
    private var appEverLoaded = false // true once the web app has loaded successfully at least once

    private val handler = Handler(Looper.getMainLooper())

    private val dpm by lazy { getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager }
    private val adminComponent by lazy { ComponentName(this, KioskDeviceAdminReceiver::class.java) }
    private val connectivityManager by lazy { getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        // Do NOT gate on NET_CAPABILITY_VALIDATED: on Android 7 that validation
        // (a background check to a Google endpoint) can silently never complete
        // on a perfectly working network, stranding the unit on the WiFi screen.
        // Any network claiming INTERNET is worth an attempt — the real test is
        // whether the web app actually loads (see the ProgressDelegate below).
        override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
            if (caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
                runOnUiThread { attemptShowApp() }
            }
        }

        override fun onLost(network: Network) {
            runOnUiThread { if (!hasNetwork()) showWifiSetup() }
        }
    }

    // While on the WiFi screen, keep retrying so a late-arriving or slow-to-
    // validate connection is picked up without any user action.
    private val retryRunnable = object : Runnable {
        override fun run() {
            if (!showingApp && hasNetwork()) attemptShowApp()
            handler.postDelayed(this, 8000)
        }
    }

    // Load-outcome signal from GeckoView: the authoritative "are we really online"
    private val progressDelegate = object : GeckoSession.ProgressDelegate {
        override fun onPageStop(sess: GeckoSession, success: Boolean) {
            if (success) {
                appEverLoaded = true
            } else if (showingApp && !appEverLoaded) {
                // Initial handoff failed (WiFi connected but no real internet yet)
                // — fall back to the WiFi screen; the retry loop will try again.
                // Once the app has loaded once, the web layer's own self-heal owns
                // reload failures, so we don't yank back to WiFi after that.
                appLoaded = false
                runOnUiThread { showWifiSetup() }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setupDeviceOwnerLockdown()

        val runtime = geckoRuntime ?: GeckoRuntime.create(
            applicationContext,
            GeckoRuntimeSettings.Builder()
                .remoteDebuggingEnabled(BuildConfig.DEBUG) // inspect via Firefox about:debugging
                .build()
        ).also { geckoRuntime = it }

        session = GeckoSession()
        session.progressDelegate = progressDelegate
        session.open(runtime)
        geckoView = GeckoView(this)
        geckoView.setSession(session)

        wifiSetupView = WifiSetupView(this, WifiController(this), ::hasLocationPermission, ::requestLocationPermission, ::attemptShowApp)

        val root = FrameLayout(this)
        root.addView(geckoView, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        root.addView(wifiSetupView, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(root)

        if (hasNetwork()) showApp() else showWifiSetup()

        // Ask once on first launch so the WiFi list works whenever it's needed
        if (!hasLocationPermission()) requestLocationPermission()
    }

    override fun onResume() {
        super.onResume()
        enterImmersiveMode()
        connectivityManager.registerNetworkCallback(
            NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build(),
            networkCallback
        )
        handler.postDelayed(retryRunnable, 8000)
    }

    override fun onPause() {
        super.onPause()
        runCatching { connectivityManager.unregisterNetworkCallback(networkCallback) }
        handler.removeCallbacks(retryRunnable)
    }

    override fun onDestroy() {
        super.onDestroy()
        wifiSetupView.stopScanning()
        session.close()
    }

    override fun onBackPressed() {
        // Swallow back: the kiosk experience is the only experience
    }

    // "Connected to a network claiming internet" — deliberately NOT requiring
    // NET_CAPABILITY_VALIDATED (see networkCallback). The web app's load success
    // is the real online test.
    private fun hasNetwork(): Boolean {
        val caps = connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    // Try to hand off to the app if there's any network; safe to call repeatedly
    private fun attemptShowApp() {
        if (showingApp) return
        if (hasNetwork()) showApp()
    }

    private fun showApp() {
        if (showingApp) return
        showingApp = true
        wifiSetupView.stopScanning()
        wifiSetupView.visibility = View.GONE
        geckoView.visibility = View.VISIBLE
        if (!appLoaded) {
            appLoaded = true
            session.loadUri(BuildConfig.APP_URL)
        }
    }

    private fun showWifiSetup() {
        if (!showingApp && wifiSetupView.visibility == View.VISIBLE) return
        showingApp = false
        geckoView.visibility = View.GONE
        wifiSetupView.visibility = View.VISIBLE
        wifiSetupView.startScanning()
    }

    /**
     * When provisioned as Device Owner: pin this app as the persistent home screen,
     * whitelist it for lock task mode, and self-grant location (needed for WiFi scans).
     * Without Device Owner (plain sideload during development) everything still runs,
     * minus the lockdown and programmatic WiFi join.
     */
    private fun setupDeviceOwnerLockdown() {
        if (!dpm.isDeviceOwnerApp(packageName)) return

        dpm.setLockTaskPackages(adminComponent, arrayOf(packageName))

        val homeFilter = IntentFilter(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            addCategory(Intent.CATEGORY_DEFAULT)
        }
        dpm.addPersistentPreferredActivity(
            adminComponent, homeFilter, ComponentName(this, MainActivity::class.java)
        )

        dpm.setPermissionGrantState(
            adminComponent, packageName,
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            dpm.setLocationEnabled(adminComponent, true)
        }

        startLockTask()
    }

    private fun enterImmersiveMode() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
    }
}
