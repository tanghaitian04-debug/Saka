package com.tang.video

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.ServiceInfo
import androidx.core.app.NotificationCompat
import androidx.work.*
import com.chaquo.python.Python
import org.json.JSONArray
import java.io.File

class DownloadWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    private var lastUpdate = 0L
    private var percent = 0
    private var phase = "正在准备下载"
    class Callback(private val worker: DownloadWorker) {
        fun cancelled(): Boolean = worker.isStopped
        fun progress(value: Int, text: String) { worker.report(value, text) }
    }
    private fun foreground(): ForegroundInfo {
        val manager = applicationContext.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel("downloads", "视频下载", NotificationManager.IMPORTANCE_LOW))
        val notification = NotificationCompat.Builder(applicationContext, "downloads")
            .setSmallIcon(com.tang.video.R.drawable.ic_download).setContentTitle("Video Downloader")
            .setContentText(phase).setProgress(100, percent, percent == 0).setOngoing(true)
            .addAction(0, "取消", WorkManager.getInstance(applicationContext).createCancelPendingIntent(id)).build()
        return ForegroundInfo(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
    }
    private fun report(value: Int, text: String) {
        percent = value; phase = text
        val now = System.currentTimeMillis()
        if (now - lastUpdate >= 800 || value >= 90) {
            lastUpdate = now
            setProgressAsync(workDataOf("percent" to value, "phase" to text))
            setForegroundAsync(foreground())
        }
    }
    override fun doWork(): Result {
        val title = inputData.getString("title") ?: "视频"
        val folder = File(applicationContext.cacheDir, "job-$id").apply { mkdirs() }
        var savedUri: android.net.Uri? = null
        try {
            setForegroundAsync(foreground()).get()
            check(!isStopped) { "下载已取消" }
            val url = LinkPolicy.normalize(checkNotNull(inputData.getString("url")))
            val paths = JSONArray(Python.getInstance().getModule("engine").callAttr("download", url,
                checkNotNull(inputData.getString("video")), inputData.getString("audio") ?: "",
                folder.absolutePath, Engine.qjs(applicationContext), Engine.cache(applicationContext), Callback(this)).toString())
            report(92, "正在合并音视频")
            val output = File(folder, "output.mp4")
            NativeMuxer.merge(applicationContext, File(paths.getString(0)), if (paths.length() > 1) File(paths.getString(1)) else null, output) { isStopped }
            report(97, "正在保存到下载目录")
            savedUri = MediaFiles.save(applicationContext, output, title) { isStopped }
            check(!isStopped) { "下载已取消" }
            HistoryStore(applicationContext).add(History(title, savedUri.toString(), System.currentTimeMillis(), "完成", "Download/Video Downloader"))
            report(100, "下载完成")
            return Result.success(workDataOf("phase" to "下载完成", "uri" to savedUri.toString()))
        } catch (e: Exception) {
            savedUri?.let { applicationContext.contentResolver.delete(it, null, null) }
            val message = if (isStopped) "下载已取消" else ErrorMessages.describe(e)
            runCatching { HistoryStore(applicationContext).add(History(title, "", System.currentTimeMillis(), if (isStopped) "已取消" else "失败", message)) }
            return Result.failure(workDataOf("phase" to message))
        } finally { folder.deleteRecursively() }
    }
    companion object { const val NAME = "video-download" }
}
