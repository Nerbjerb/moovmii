package com.moovmii.kiosk

import android.annotation.SuppressLint
import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * moovmii kiosk shell.
 *
 * Runs as Device Owner in lock task mode: this activity IS the home screen and the
 * only thing the tablet can do. Boots into the bundled WiFi setup page; once a
 * network connection validates against the internet, hands off to the hosted web app.
 * If connectivity is lost, falls back to the WiFi setup page automatically.
 */
class MainActivity : Activity() {

    companion object {
        private const val WIFI_SETUP_URL = "file:///android_asset/wifi-setup.html"
    }

    private lateinit var webView: WebView
    private var showingApp = false

    private val dpm by lazy { getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager }
    private val adminComponent by lazy { ComponentName(this, KioskDeviceAdminReceiver::class.java) }
    private val connectivityManager by lazy { getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
            if (caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                runOnUiThread { showApp() }
            }
        }

        override fun onLost(network: Network) {
            runOnUiThread { showWifiSetup() }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setupDeviceOwnerLockdown()

        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
        }
        webView.setBackgroundColor(0xFF0B0B0B.toInt())
        webView.webViewClient = WebViewClient()
        webView.addJavascriptInterface(WifiBridge(this), "MoovmiiNative")
        setContentView(webView)

        if (isOnline()) showApp() else showWifiSetup()
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
    }

    override fun onPause() {
        super.onPause()
        runCatching { connectivityManager.unregisterNetworkCallback(networkCallback) }
    }

    override fun onBackPressed() {
        // Swallow back: the kiosk experience is the only experience
    }

    fun isOnline(): Boolean {
        val caps = connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    private fun showApp() {
        if (showingApp) return
        showingApp = true
        webView.loadUrl(BuildConfig.APP_URL)
    }

    private fun showWifiSetup() {
        if (!showingApp && webView.url != null) return
        showingApp = false
        webView.loadUrl(WIFI_SETUP_URL)
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
