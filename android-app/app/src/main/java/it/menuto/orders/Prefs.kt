package it.menuto.orders

import android.content.Context

/** Everything the app remembers on the device. */
class Prefs(ctx: Context) {
    private val p = ctx.getSharedPreferences("menuto", Context.MODE_PRIVATE)

    var server: String?
        get() = p.getString("server", null)
        set(v) = p.edit().putString("server", v?.trimEnd('/')).apply()

    /** Restaurant being watched (set by the web page once someone is logged in). */
    var restaurantId: String?
        get() = p.getString("rid", null)
        set(v) = p.edit().putString("rid", v).apply()

    var printerAddress: String?
        get() = p.getString("printer", null)
        set(v) = p.edit().putString("printer", v).apply()

    /** "none", "kitchen", "customer" or "kitchen,customer" */
    var autoPrint: String
        get() = p.getString("autoPrint", "none") ?: "none"
        set(v) = p.edit().putString("autoPrint", v).apply()

    var columns: Int
        get() = p.getInt("cols", 42)
        set(v) = p.edit().putInt("cols", v).apply()

    var copies: Int
        get() = p.getInt("copies", 1)
        set(v) = p.edit().putInt("copies", v.coerceIn(1, 5)).apply()
}
