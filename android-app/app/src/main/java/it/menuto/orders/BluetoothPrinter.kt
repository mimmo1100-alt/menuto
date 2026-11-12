package it.menuto.orders

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import java.io.IOException
import java.util.UUID

/**
 * Sends raw ESC/POS bytes to a paired Bluetooth printer (Epson TM series and compatibles) over the
 * classic serial profile. Each print opens a fresh connection, so a printer that was switched off or
 * went out of range works again on the next order without restarting anything.
 */
object BluetoothPrinter {
    private val SPP: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    private fun adapter(ctx: Context): BluetoothAdapter? =
        (ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter

    @SuppressLint("MissingPermission")
    fun paired(ctx: Context): List<Pair<String, String>> {
        val a = adapter(ctx) ?: return emptyList()
        return try {
            a.bondedDevices.map { (it.name ?: it.address) to it.address }.sortedBy { it.first }
        } catch (e: SecurityException) {
            emptyList()
        }
    }

    @SuppressLint("MissingPermission")
    @Synchronized
    fun print(ctx: Context, address: String, data: ByteArray, attempts: Int = 3) {
        val a = adapter(ctx) ?: throw IOException("Bluetooth not available")
        var last: Exception? = null
        repeat(attempts) { n ->
            var socket: BluetoothSocket? = null
            try {
                a.cancelDiscovery()
                val device = a.getRemoteDevice(address)
                socket = device.createRfcommSocketToServiceRecord(SPP)
                socket.connect()
                socket.outputStream.apply { write(data); flush() }
                Thread.sleep(400) // let the printer drain its buffer before closing
                return
            } catch (e: Exception) {
                last = e
                Thread.sleep(700L * (n + 1))
            } finally {
                try { socket?.close() } catch (_: IOException) {}
            }
        }
        throw IOException("Print failed: ${last?.message}", last)
    }
}
