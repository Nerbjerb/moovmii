package com.moovmii.kiosk

import android.content.Context
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager

data class WifiNetwork(val ssid: String, val secured: Boolean, val strength: Int /* 1..4 */)

/**
 * Native WiFi scanning/joining for the setup screen.
 *
 * Uses the legacy WifiManager network APIs, which are deprecated for normal apps
 * on Android 10+ but remain fully available to Device Owner apps — that exemption
 * is what makes programmatic WiFi join possible in this kiosk.
 */
class WifiController(context: Context) {

    private val wifiManager =
        context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

    /** Visible networks, strongest first, deduped by SSID. */
    fun scanNetworks(): List<WifiNetwork> {
        @Suppress("DEPRECATION")
        wifiManager.startScan()

        val seen = LinkedHashMap<String, WifiNetwork>()
        @Suppress("DEPRECATION")
        for (result in wifiManager.scanResults.sortedByDescending { it.level }) {
            val ssid = result.SSID
            if (ssid.isNullOrBlank() || seen.containsKey(ssid)) continue
            val secured = result.capabilities.contains("WPA") || result.capabilities.contains("WEP")
            val strength = WifiManager.calculateSignalLevel(result.level, 4) + 1
            seen[ssid] = WifiNetwork(ssid, secured, strength)
        }
        return seen.values.toList()
    }

    /** Joins the given network. Empty password = open network. Returns false if config was rejected. */
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
}
