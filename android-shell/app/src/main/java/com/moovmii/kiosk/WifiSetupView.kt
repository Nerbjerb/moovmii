package com.moovmii.kiosk

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView

/**
 * Native WiFi setup UI (list → password → connecting), replacing the old
 * WebView-based page. Styled to match the moovmii web app's WiFi mock:
 * #0b0b0b background, #2D2C31 rows, #FFD200 connect button.
 *
 * MainActivity swaps this view out for the GeckoView the moment the network
 * validates, so "connecting" only needs to wait or time out.
 */
class WifiSetupView(context: Context, private val wifi: WifiController) : FrameLayout(context) {

    private val handler = Handler(Looper.getMainLooper())
    private var selected: WifiNetwork? = null
    private var connectTimeout: Runnable? = null

    private val listScreen: LinearLayout
    private val networkList: LinearLayout
    private val passwordScreen: LinearLayout
    private val passwordSsid: TextView
    private val passwordError: TextView
    private val passwordInput: EditText
    private val connectButton: Button
    private val connectingScreen: LinearLayout
    private val connectingText: TextView

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    private fun rounded(color: Int, radiusDp: Int): GradientDrawable =
        GradientDrawable().apply { setColor(color); cornerRadius = dp(radiusDp).toFloat() }

    private fun text(size: Float, color: Int, bold: Boolean = false, value: String = ""): TextView =
        TextView(context).apply {
            textSize = size
            setTextColor(color)
            typeface = if (bold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            text = value
        }

    init {
        setBackgroundColor(Color.parseColor("#0b0b0b"))

        // --- Screen: network list ---
        networkList = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
        listScreen = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(28), dp(24), dp(28), dp(24))
            addView(text(13f, Color.parseColor("#888888"), value = "WIFI SETUP").apply {
                letterSpacing = 0.08f
                gravity = Gravity.CENTER_HORIZONTAL
            }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
            addView(text(22f, Color.WHITE, bold = true, value = "Select a Network").apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                topMargin = dp(4); bottomMargin = dp(20)
            })
            addView(ScrollView(context).apply { addView(networkList) },
                LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.MATCH_PARENT))
        }

        // --- Screen: password entry ---
        passwordSsid = text(20f, Color.WHITE, bold = true)
        passwordError = text(13f, Color.parseColor("#F87171"))
        passwordInput = EditText(context).apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            hint = "Password"
            setHintTextColor(Color.parseColor("#777777"))
            setTextColor(Color.WHITE)
            textSize = 16f
            background = rounded(Color.parseColor("#2D2C31"), 6)
            setPadding(dp(16), dp(14), dp(16), dp(14))
        }
        val showPassword = CheckBox(context).apply {
            text = "Show password"
            setTextColor(Color.parseColor("#888888"))
            setOnCheckedChangeListener { _, checked ->
                val sel = passwordInput.selectionEnd
                passwordInput.inputType = InputType.TYPE_CLASS_TEXT or
                    (if (checked) InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD else InputType.TYPE_TEXT_VARIATION_PASSWORD)
                passwordInput.setSelection(sel)
            }
        }
        connectButton = Button(context).apply {
            text = "Connect"
            isAllCaps = false
            textSize = 16f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.BLACK)
            background = rounded(Color.parseColor("#FFD200"), 6)
            setPadding(dp(36), dp(12), dp(36), dp(12))
            setOnClickListener { doConnect(passwordInput.text.toString()) }
        }
        val cancelButton = Button(context).apply {
            text = "Cancel"
            isAllCaps = false
            textSize = 14f
            setTextColor(Color.parseColor("#888888"))
            setBackgroundColor(Color.TRANSPARENT)
            setOnClickListener { showScreen(listScreen) }
        }
        passwordScreen = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(24), dp(28), dp(24))
            addView(passwordSsid, lpWrap().apply { gravity = Gravity.CENTER_HORIZONTAL })
            addView(text(13f, Color.parseColor("#888888"), value = "Enter WiFi password"),
                lpWrap().apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = dp(4) })
            addView(passwordError, lpWrap().apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = dp(6) })
            addView(passwordInput, LinearLayout.LayoutParams(dp(460), LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                gravity = Gravity.CENTER_HORIZONTAL; topMargin = dp(16)
            })
            addView(showPassword, lpWrap().apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = dp(8) })
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                addView(cancelButton)
                addView(connectButton, lpWrap().apply { leftMargin = dp(12) })
            }, lpWrap().apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = dp(16) })
        }

        // --- Screen: connecting ---
        connectingText = text(18f, Color.WHITE, bold = true)
        connectingScreen = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            addView(ProgressBar(context), lpWrap().apply { gravity = Gravity.CENTER_HORIZONTAL })
            addView(connectingText, lpWrap().apply { gravity = Gravity.CENTER_HORIZONTAL; topMargin = dp(16) })
        }

        for (screen in listOf(listScreen, passwordScreen, connectingScreen)) {
            addView(screen, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        }
        showScreen(listScreen)
    }

    private fun lpWrap() = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
    )

    private fun showScreen(screen: View) {
        listScreen.visibility = if (screen === listScreen) VISIBLE else GONE
        passwordScreen.visibility = if (screen === passwordScreen) VISIBLE else GONE
        connectingScreen.visibility = if (screen === connectingScreen) VISIBLE else GONE
    }

    // --- Scanning ---

    private val scanTick = object : Runnable {
        override fun run() {
            refreshNetworks()
            handler.postDelayed(this, 8000)
        }
    }

    fun startScanning() {
        handler.removeCallbacks(scanTick)
        handler.post(scanTick)
        showScreen(listScreen)
    }

    fun stopScanning() {
        handler.removeCallbacks(scanTick)
        connectTimeout?.let { handler.removeCallbacks(it) }
    }

    private fun refreshNetworks() {
        if (listScreen.visibility != VISIBLE) return
        networkList.removeAllViews()
        for (network in wifi.scanNetworks()) {
            networkList.addView(networkRow(network),
                LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(58)).apply { bottomMargin = dp(8) })
        }
    }

    private fun networkRow(network: WifiNetwork): View =
        LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = rounded(Color.parseColor("#2D2C31"), 6)
            setPadding(dp(16), 0, dp(16), 0)
            addView(text(16f, Color.WHITE, bold = true, value = network.ssid),
                LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
            addView(text(13f, Color.parseColor("#aaaaaa"),
                value = "▂▄▆█".take(network.strength) + (if (network.secured) "  🔒" else "")))
            setOnClickListener {
                selected = network
                if (network.secured) {
                    passwordSsid.text = network.ssid
                    passwordError.text = ""
                    passwordInput.setText("")
                    showScreen(passwordScreen)
                } else {
                    doConnect("")
                }
            }
        }

    // --- Connecting ---

    private fun doConnect(password: String) {
        val network = selected ?: return
        connectingText.text = "Connecting to ${network.ssid}..."
        showScreen(connectingScreen)

        val accepted = wifi.connect(network.ssid, password)
        if (!accepted) {
            connectFailed(network)
            return
        }

        // MainActivity navigates away once the network validates; if that never
        // happens, fall back to the password screen with an error
        val timeout = Runnable { connectFailed(network) }
        connectTimeout = timeout
        handler.postDelayed(timeout, 25000)
    }

    private fun connectFailed(network: WifiNetwork) {
        connectTimeout?.let { handler.removeCallbacks(it) }
        if (network.secured) {
            passwordError.text = "Couldn't join ${network.ssid}. Check the password and try again."
            showScreen(passwordScreen)
        } else {
            showScreen(listScreen)
        }
    }
}
