package com.tang.video

import android.app.Application
import android.content.Context
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
import java.net.URI

class DownloaderApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (!Python.isStarted()) Python.start(AndroidPlatform(this))
    }
}

object LinkPolicy {
    private val hosts = listOf("youtube.com", "youtu.be", "x.com", "twitter.com", "tiktok.com", "bilibili.com", "b23.tv", "instagram.com")
    fun normalize(text: String): String {
        val value = Regex("https://[^\\s<>\"]+", RegexOption.IGNORE_CASE).find(text.trim())?.value
            ?.trimEnd('.', ',', '，', '。', ')', '）') ?: throw IllegalArgumentException("请粘贴 HTTPS 视频链接")
        val uri = URI(value)
        val host = uri.host?.lowercase() ?: ""
        require(uri.scheme.equals("https", true) && uri.userInfo == null && uri.port in listOf(-1,443) && hosts.any { host == it || host.endsWith(".$it") }) { "暂不支持此平台，请粘贴公开视频链接" }
        return value
    }
    fun filename(title: String): String = title.replace(Regex("[\\p{Cntrl}/\\\\:*?\"<>|]"), "_").take(90).trim().ifEmpty { "视频" } + ".mp4"
}

data class Quality(val video: String, val audio: String, val label: String, val bytes: Long)
data class Video(val url: String, val title: String, val thumbnail: String, val duration: Int, val choices: List<Quality>)
data class History(val title: String, val uri: String, val time: Long, val status: String, val detail: String)

object Engine {
    fun qjs(context: Context) = File(context.applicationInfo.nativeLibraryDir, "libvdqjs.so").absolutePath
    fun cache(context: Context) = File(context.cacheDir, "ytdlp").apply { mkdirs() }.absolutePath
    fun inspect(context: Context, url: String): Video {
        val data = JSONObject(Python.getInstance().getModule("engine").callAttr("inspect", url, qjs(context), cache(context)).toString())
        val arr = data.getJSONArray("choices")
        return Video(url, data.getString("title"), data.optString("thumbnail"), data.optDouble("duration").toInt(),
            List(arr.length()) { index -> arr.getJSONObject(index).let { Quality(it.getString("video"), it.getString("audio"), it.getString("label"), it.optLong("bytes")) } })
    }
}

class HistoryStore(context: Context) {
    private val prefs = context.getSharedPreferences("history", Context.MODE_PRIVATE)
    fun load(): List<History> = synchronized(lock) {
        val arr = JSONArray(prefs.getString("items", "[]"))
        List(arr.length()) { i -> arr.getJSONObject(i).let { History(it.getString("title"), it.optString("uri"), it.getLong("time"), it.getString("status"), it.optString("detail")) } }
    }
    fun add(item: History) = synchronized(lock) {
        val arr = JSONArray()
        (listOf(item) + load()).take(200).forEach { h -> arr.put(JSONObject().put("title", h.title).put("uri", h.uri).put("time", h.time).put("status", h.status).put("detail", h.detail)) }
        check(prefs.edit().putString("items", arr.toString()).commit()) { "下载历史保存失败" }
    }
    companion object { private val lock = Any() }
}
