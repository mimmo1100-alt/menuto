package it.menuto.orders

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject

/**
 * Runs while a restaurant is being watched, also with the screen off.
 * Every few seconds it asks the server how many orders are waiting: while any are, it rings with the
 * ALARM volume (so the rest of the phone keeps its own volume) and shows a full-screen alert.
 * It also prints accepted orders that have not been printed yet, so auto-accepted orders print too.
 * Network errors are retried forever; the service never needs a restart after the connection drops.
 */
class OrderWatchService : Service() {
    companion object {
        private const val CH_STATUS = "status"
        private const val CH_ORDERS = "orders"
        private const val ID_STATUS = 1
        private const val ID_ORDERS = 2
        var lastError: String? = null
            private set

        fun start(ctx: Context) {
            ContextCompat.startForegroundService(ctx, Intent(ctx, OrderWatchService::class.java))
        }
        fun stop(ctx: Context) { ctx.stopService(Intent(ctx, OrderWatchService::class.java)) }
    }

    private lateinit var thread: HandlerThread
    private lateinit var handler: Handler
    private var player: MediaPlayer? = null
    private var wake: PowerManager.WakeLock? = null
    private var failures = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        channels()
        val n = statusNotification("…")
        if (Build.VERSION.SDK_INT >= 34) startForeground(ID_STATUS, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        else startForeground(ID_STATUS, n)
        wake = (getSystemService(POWER_SERVICE) as PowerManager).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "menuto:watch").apply { setReferenceCounted(false) }
        thread = HandlerThread("menuto-watch").apply { start() }
        handler = Handler(thread.looper)
        handler.post(::tick)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        thread.quitSafely()
        stopRinging()
        super.onDestroy()
    }

    private fun tick() {
        val prefs = Prefs(this)
        val server = prefs.server
        val rid = prefs.restaurantId
        var delay = 5000L
        if (server == null || rid == null) { stopSelf(); return }
        try {
            wake?.acquire(30_000)
            val api = Api(server)
            val (code, body) = api.getText("/api/kitchen/$rid/pending")
            if (code == 401) {
                lastError = "login"
                updateStatus(getString(R.string.app_name) + " · login")
                stopRinging()
            } else if (code in 200..299) {
                failures = 0; lastError = null
                val j = JSONObject(body)
                val ringing = j.optInt("ringing", 0)
                if (ringing > 0) startRinging(ringing) else stopRinging()
                updateStatus(if (ringing > 0) "● $ringing" else "✓")
                printQueue(api, rid, prefs, j)
            } else {
                throw java.io.IOException("HTTP $code")
            }
        } catch (e: Exception) {
            failures++
            lastError = e.message
            updateStatus("⚠ ${e.message ?: "offline"}")
            delay = (5000L * failures).coerceAtMost(30_000L) // back off, but keep trying
        } finally {
            if (wake?.isHeld == true) wake?.release()
        }
        handler.postDelayed(::tick, delay)
    }

    private fun printQueue(api: Api, rid: String, prefs: Prefs, j: JSONObject) {
        val printer = prefs.printerAddress ?: return
        val templates = prefs.autoPrint
        if (templates == "none") return
        val list = j.optJSONArray("toPrint") ?: return
        for (i in 0 until list.length()) {
            val id = list.getJSONObject(i).getString("id")
            try {
                val bytes = api.getBytes("/api/kitchen/$rid/orders/$id/receipt?t=$templates&f=escpos&cols=${prefs.columns}")
                repeat(prefs.copies) { BluetoothPrinter.print(this, printer, bytes) }
                api.post("/api/kitchen/$rid/orders/$id/printed")
            } catch (e: Exception) {
                lastError = "printer: ${e.message}"
                updateStatus("⚠ printer")
                return // try again on the next tick
            }
        }
    }

    private fun startRinging(count: Int) {
        if (player == null) {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM) ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            player = MediaPlayer().apply {
                setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                setDataSource(this@OrderWatchService, uri)
                isLooping = true
                prepare(); start()
            }
        }
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(this, CH_ORDERS)
            .setSmallIcon(R.drawable.ic_stat_order)
            .setContentTitle(if (count == 1) "Nuovo ordine" else "$count nuovi ordini")
            .setContentText("Tocca per accettare")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(open)
            .setFullScreenIntent(open, true)
            .setOngoing(true)
            .build()
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(ID_ORDERS, n)
    }

    private fun stopRinging() {
        player?.let { try { it.stop() } catch (_: Exception) {}; it.release() }
        player = null
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).cancel(ID_ORDERS)
    }

    private fun channels() {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(NotificationChannel(CH_STATUS, "Collegamento", NotificationManager.IMPORTANCE_LOW))
        nm.createNotificationChannel(NotificationChannel(CH_ORDERS, "Nuovi ordini", NotificationManager.IMPORTANCE_HIGH).apply {
            setSound(null, null) // the service plays the alarm itself
            enableVibration(true)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        })
    }

    private fun statusNotification(text: String): Notification {
        val open = PendingIntent.getActivity(this, 1, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CH_STATUS)
            .setSmallIcon(R.drawable.ic_stat_order)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(text)
            .setOngoing(true)
            .setContentIntent(open)
            .build()
    }

    private fun updateStatus(text: String) {
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(ID_STATUS, statusNotification(text))
    }
}
