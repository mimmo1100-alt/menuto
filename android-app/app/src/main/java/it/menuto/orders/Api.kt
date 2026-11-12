package it.menuto.orders

import android.webkit.CookieManager
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

/** Calls to the Menuto server with the session cookie the user got by logging in inside the app. */
class Api(private val server: String) {
    private fun open(path: String, method: String = "GET"): HttpURLConnection {
        val c = URL(server + path).openConnection() as HttpURLConnection
        c.requestMethod = method
        c.connectTimeout = 8000
        c.readTimeout = 15000
        CookieManager.getInstance().getCookie(server)?.let { c.setRequestProperty("Cookie", it) }
        return c
    }

    fun getText(path: String): Pair<Int, String> {
        val c = open(path)
        return try {
            val code = c.responseCode
            val body = (if (code in 200..299) c.inputStream else c.errorStream)?.bufferedReader()?.readText() ?: ""
            code to body
        } finally { c.disconnect() }
    }

    fun getBytes(path: String): ByteArray {
        val c = open(path)
        try {
            if (c.responseCode !in 200..299) throw java.io.IOException("HTTP ${c.responseCode}")
            val out = ByteArrayOutputStream()
            c.inputStream.use { it.copyTo(out) }
            return out.toByteArray()
        } finally { c.disconnect() }
    }

    fun post(path: String): Int {
        val c = open(path, "POST")
        c.doOutput = true
        c.setRequestProperty("Content-Type", "application/json")
        return try { c.outputStream.use { it.write("{}".toByteArray()) }; c.responseCode } finally { c.disconnect() }
    }
}
