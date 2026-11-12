package it.menuto.orders

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.text.InputType
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import kotlin.concurrent.thread

/**
 * Shows the Menuto orders screen in a WebView and gives that page (only when it comes from the
 * configured Menuto server) a small bridge, window.MenutoNative, for Bluetooth printing and the
 * background order watcher.
 */
class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView
    private lateinit var prefs: Prefs
    @Volatile private var pageHost: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        web = WebView(this)
        setContentView(web)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)
        web.addJavascriptInterface(Bridge(), "MenutoNative")
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                val server = prefs.server ?: return false
                return if (req.url.host == Uri.parse(server).host) false
                else { startActivity(Intent(Intent.ACTION_VIEW, req.url)); true } // maps, phone numbers, other sites
            }
            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) { pageHost = Uri.parse(url).host }
            override fun onPageFinished(view: WebView, url: String) { pageHost = Uri.parse(url).host; CookieManager.getInstance().flush() }
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { if (web.canGoBack()) web.goBack() else moveTaskToBack(true) }
        })
        askPermissions()
        if (prefs.server == null) askServer() else open()
    }

    private fun open() { web.loadUrl(prefs.server + "/dashboard/orders") }

    private fun askServer() {
        val input = EditText(this).apply {
            inputType = InputType.TYPE_TEXT_VARIATION_URI
            setText(prefs.server ?: "https://")
            setSelection(text.length)
        }
        AlertDialog.Builder(this)
            .setTitle("Indirizzo di Menuto")
            .setMessage("Esempio: https://menuto.vercel.app")
            .setView(input)
            .setCancelable(prefs.server != null)
            .setPositiveButton("OK") { _, _ ->
                var url = input.text.toString().trim()
                if (!url.startsWith("http")) url = "https://$url"
                prefs.server = url
                open()
            }
            .show()
    }

    private fun askPermissions() {
        val need = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= 33) need += Manifest.permission.POST_NOTIFICATIONS
        if (Build.VERSION.SDK_INT >= 31) need += Manifest.permission.BLUETOOTH_CONNECT
        val missing = need.filter { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isNotEmpty()) ActivityCompat.requestPermissions(this, missing.toTypedArray(), 1)
        // keep the watcher alive: ask once to be left out of battery optimisation
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            try {
                startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName")))
            } catch (_: Exception) { }
        }
    }

    private fun js(code: String) = runOnUiThread { web.evaluateJavascript(code, null) }

    /** Methods the Menuto web page can call. Every call checks that the page really is the Menuto server. */
    inner class Bridge {
        private fun trusted(): Boolean {
            val server = prefs.server ?: return false
            return pageHost != null && pageHost == Uri.parse(server).host
        }

        @JavascriptInterface fun isNative(): Boolean = trusted()

        @JavascriptInterface fun printers(): String {
            if (!trusted()) return "[]"
            val arr = JSONArray()
            BluetoothPrinter.paired(this@MainActivity).forEach { (n, a) -> arr.put(JSONObject().put("name", n).put("address", a)) }
            return arr.toString()
        }

        @JavascriptInterface fun settings(): String {
            if (!trusted()) return "{}"
            return JSONObject()
                .put("printer", prefs.printerAddress ?: JSONObject.NULL)
                .put("autoPrint", prefs.autoPrint).put("cols", prefs.columns).put("copies", prefs.copies)
                .put("watching", prefs.restaurantId ?: JSONObject.NULL)
                .put("lastError", OrderWatchService.lastError ?: JSONObject.NULL)
                .put("version", BuildConfigVersion.name(this@MainActivity))
                .toString()
        }

        /** {printer, autoPrint, cols, copies} */
        @JavascriptInterface fun configure(json: String) {
            if (!trusted()) return
            val j = JSONObject(json)
            if (j.has("printer")) prefs.printerAddress = j.optString("printer").ifBlank { null }
            if (j.has("autoPrint")) prefs.autoPrint = j.optString("autoPrint", "none")
            if (j.has("cols")) prefs.columns = j.optInt("cols", 42)
            if (j.has("copies")) prefs.copies = j.optInt("copies", 1)
        }

        /** Start ringing/printing in the background for this restaurant. */
        @JavascriptInterface fun watch(restaurantId: String) {
            if (!trusted()) return
            prefs.restaurantId = restaurantId
            runOnUiThread { OrderWatchService.start(this@MainActivity) }
        }

        @JavascriptInterface fun stopWatching() {
            if (!trusted()) return
            prefs.restaurantId = null
            runOnUiThread { OrderWatchService.stop(this@MainActivity) }
        }

        /** Download ESC/POS bytes from a Menuto path and print them; the result comes back as a "menuto-print" event. */
        @JavascriptInterface fun printPath(path: String) {
            if (!trusted() || !path.startsWith("/api/")) return
            val server = prefs.server ?: return
            val printer = prefs.printerAddress
            thread {
                val result = try {
                    if (printer == null) throw IllegalStateException("no-printer")
                    val bytes = Api(server).getBytes(path)
                    BluetoothPrinter.print(this@MainActivity, printer, bytes)
                    "{ok:true}"
                } catch (e: Exception) {
                    "{ok:false,error:" + JSONObject.quote(e.message ?: "error") + "}"
                }
                js("window.dispatchEvent(new CustomEvent('menuto-print',{detail:$result}))")
            }
        }

        @JavascriptInterface fun changeServer() { if (trusted()) runOnUiThread { askServer() } }
    }
}

object BuildConfigVersion {
    fun name(ctx: android.content.Context): String = try {
        ctx.packageManager.getPackageInfo(ctx.packageName, 0).versionName ?: ""
    } catch (_: Exception) { "" }
}
