package it.menuto.orders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Starts watching again after the phone restarts, if a restaurant was being watched. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED && Prefs(ctx).restaurantId != null) {
            OrderWatchService.start(ctx)
        }
    }
}
