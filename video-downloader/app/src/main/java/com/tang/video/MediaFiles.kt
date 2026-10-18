package com.tang.video

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import java.io.File
import java.util.concurrent.TimeUnit

object MediaFiles {
    fun save(context: Context, file: File, title: String, cancelled: () -> Boolean = { false }): Uri {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, LinkPolicy.filename(title))
            put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Video Downloader")
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val uri = checkNotNull(resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)) { "无法创建下载文件" }
        try {
            checkNotNull(resolver.openOutputStream(uri)).use { output ->
                file.inputStream().use { input ->
                    val buffer = ByteArray(1024 * 256)
                    while (true) {
                        check(!cancelled()) { "下载已取消" }
                        val count = input.read(buffer)
                        if (count < 0) break
                        output.write(buffer, 0, count)
                    }
                }
            }
            check(!cancelled()) { "下载已取消" }
            check(resolver.update(uri, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null) == 1) { "发布下载文件失败" }
            return uri
        } catch (e: Exception) {
            resolver.delete(uri, null, null)
            throw e
        }
    }
}

object NativeMuxer {
    fun executable(context: Context) = File(context.applicationInfo.nativeLibraryDir, "libvdffmpeg.so").absolutePath
    fun merge(context: Context, video: File, audio: File?, output: File, cancelled: () -> Boolean = { false }) {
        val args = mutableListOf(executable(context), "-nostdin", "-y", "-v", "error", "-i", video.absolutePath)
        if (audio != null) args += listOf("-i", audio.absolutePath, "-map", "0:v:0", "-map", "1:a:0")
        else args += listOf("-map", "0:v:0", "-map", "0:a:0")
        args += listOf("-c", "copy", "-movflags", "+faststart", output.absolutePath)
        val log = File(output.parentFile, "ffmpeg.log")
        val process = ProcessBuilder(args).redirectErrorStream(true).redirectOutput(log).start()
        try {
            val deadline = System.nanoTime() + TimeUnit.MINUTES.toNanos(10)
            while (!process.waitFor(250, TimeUnit.MILLISECONDS)) {
                check(!cancelled()) { "下载已取消" }
                check(System.nanoTime() < deadline) { "音视频合并超时" }
            }
            check(!cancelled()) { "下载已取消" }
            check(process.exitValue() == 0 && output.length() > 0) { "FFmpeg 合并失败：" + log.takeIf { it.exists() }?.readText()?.takeLast(1200) }
        } finally {
            process.destroy()
            if (process.isAlive) process.destroyForcibly()
        }
    }
}
