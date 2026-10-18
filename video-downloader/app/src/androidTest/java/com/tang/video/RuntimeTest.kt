package com.tang.video

import android.media.MediaExtractor
import android.media.MediaFormat
import android.provider.MediaStore
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.chaquo.python.Python
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class RuntimeTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun mainActivityLaunchesWithComposeAndWorkManager() {
        androidx.test.core.app.ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            InstrumentationRegistry.getInstrumentation().waitForIdleSync()
            scenario.onActivity { activity -> assertTrue(activity.window.decorView.isShown) }
        }
    }
    @Test fun pythonSslExtractorsAndQuickJsLoadOnAndroid() {
        val result = Python.getInstance().getModule("engine").callAttr("self_test", Engine.qjs(context), Engine.cache(context)).toString()
        assertTrue(result.startsWith("2026."))
    }
    @Test fun androidFfmpegStarts() {
        val out = File(context.cacheDir, "ffmpeg-version.txt")
        val p = ProcessBuilder(NativeMuxer.executable(context), "-version").redirectErrorStream(true).redirectOutput(out).start()
        assertTrue(p.waitFor(20, TimeUnit.SECONDS))
        assertEquals(0, p.exitValue())
        assertTrue(out.readText().contains("ffmpeg version 7.1.3"))
    }
    @Test fun mergePreservesVideoAndAudioAndPublishesToDownloads() {
        val folder = File(context.cacheDir, "test-mux").apply { mkdirs() }
        val assets = InstrumentationRegistry.getInstrumentation().context.assets
        fun asset(name: String) = File(folder, name).also { file -> assets.open(name).use { input -> file.outputStream().use { input.copyTo(it) } } }
        val video = asset("video.mp4"); val audio = asset("audio.m4a")
        val output = File(folder, "result.mp4")
        var uri: android.net.Uri? = null
        try {
            NativeMuxer.merge(context, video, audio, output)
            val extractor = MediaExtractor()
            try {
                extractor.setDataSource(output.absolutePath)
                val mimes = (0 until extractor.trackCount).map { extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME) ?: "" }
                assertTrue(mimes.any { it.startsWith("video/") })
                assertTrue(mimes.any { it.startsWith("audio/") })
            } finally { extractor.release() }
            uri = MediaFiles.save(context, output, "自动化测试")
            context.contentResolver.query(uri, arrayOf(MediaStore.MediaColumns.IS_PENDING, MediaStore.MediaColumns.RELATIVE_PATH, MediaStore.MediaColumns.SIZE), null, null, null)!!.use { cursor ->
                assertTrue(cursor.moveToFirst())
                assertEquals(0, cursor.getInt(0))
                assertEquals("Download/Video Downloader/", cursor.getString(1))
                assertEquals(output.length(), cursor.getLong(2))
            }
        } finally { uri?.let { context.contentResolver.delete(it, null, null) }; folder.deleteRecursively() }
    }
    @Test fun cancelledSaveDoesNotLeaveVisibleDownload() {
        val file = File(context.cacheDir, "cancel.mp4").apply { writeBytes(ByteArray(4096)) }
        try { assertThrows(IllegalStateException::class.java) { MediaFiles.save(context, file, "取消测试") { true } } }
        finally { file.delete() }
    }
}
