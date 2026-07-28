package com.moovmii.kiosk

import android.content.Context
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

/**
 * JavaScript bridge exposed to the bundled WiFi setup page as `MoovmiiNative`.
 *
 * Uses the legacy WifiManager network APIs, which are deprecated for normal apps
 * on Android 10+ but remain fully available to Device Owner apps — that exemption
 * is what makes programmatic WiFi join possible in this kiosk.
 */
class WifiBridge(private val activity: MainActivity) {

    private val wifiManager =
        activity.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

    /** Returns visible networks as JSON: [{ssid, secured, strength(1-4)}], strongest first, deduped. */
    @JavascriptInterface
    fun scanNetworks(): String {
        @Suppress("DEPRECATION")
        wifiManager.startScan()

        val seen = LinkedHashMap<String, JSONObject>()
        @Suppress("DEPRECATION")
        for (result in wifiManager.scanResults.sortedByDescending { it.level }) {
            val ssid = result.SSID
            if (ssid.isNullOrBlank() || seen.containsKey(ssid)) continue
            val secured = result.capabilities.contains("WPA") || result.capabilities.contains("WEP")
            val strength = WifiManager.calculateSignalLevel(result.level, 4) + 1 // 1..4
            seen[ssid] = JSONObject()
                .put("ssid", ssid)
                .put("secured", secured)
                .put("strength", strength)
        }
        return JSONArray(seen.values.toList()).toString()
    }

    /** Joins the given network. Empty password = open network. Returns false if config was rejected. */
    @JavascriptInterface
    fun connect(ssid: String, password: String): Boolean {
        @Suppress("DEPRECATION")
        val config = WifiConfiguration().apply {
            SSID = "\"$ssid\""
            if (password.isEmpty()) {
                allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE)
            } else {
                preSharedKey = "\"$password\""
            }
        }

        @Suppress("DEPRECATION")
        val netId = wifiManager.addNetwork(config)
        if (netId == -1) return false

        @Suppress("DEPRECATION")
        return wifiManager.enableNetwork(netId, true)
    }

    /** True once the active network has validated internet access. */
    @JavascriptInterface
    fun isOnline(): Boolean = activity.isOnline()
}
