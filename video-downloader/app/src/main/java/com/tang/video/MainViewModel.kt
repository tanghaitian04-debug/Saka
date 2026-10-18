package com.tang.video

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val _input = MutableStateFlow(""); val input = _input.asStateFlow()
    private val _video = MutableStateFlow<Video?>(null); val video = _video.asStateFlow()
    private val _loading = MutableStateFlow(false); val loading = _loading.asStateFlow()
    private val _message = MutableStateFlow(""); val message = _message.asStateFlow()
    private val _history = MutableStateFlow<List<History>>(emptyList()); val history = _history.asStateFlow()
    private val _work = MutableStateFlow<WorkInfo?>(null); val work = _work.asStateFlow()
    private val manager = WorkManager.getInstance(app)
    init {
        refresh()
        viewModelScope.launch {
            manager.getWorkInfosForUniqueWorkFlow(DownloadWorker.NAME).collect { items ->
                _work.value = items.firstOrNull { !it.state.isFinished } ?: items.maxByOrNull { it.runAttemptCount }
                refresh()
            }
        }
    }
    fun edit(value: String) { _input.value = value; _video.value = null; _message.value = "" }
    fun parse() {
        val url = try { LinkPolicy.normalize(_input.value) } catch (e: Exception) { _message.value = e.message ?: "链接无效"; return }
        _loading.value = true; _video.value = null; _message.value = ""
        val original = _input.value
        viewModelScope.launch {
            try {
                val result = withContext(Dispatchers.IO) { Engine.inspect(getApplication(), url) }
                if (_input.value == original) _video.value = result
            } catch (e: Exception) { if (_input.value == original) _message.value = (e.message ?: "解析失败").takeLast(1600) }
            finally { _loading.value = false }
        }
    }
    fun start(q: Quality) {
        val v = _video.value ?: return
        val request = OneTimeWorkRequestBuilder<DownloadWorker>()
            .setInputData(workDataOf("url" to v.url, "title" to v.title.take(500), "video" to q.video, "audio" to q.audio))
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .keepResultsForAtLeast(1, TimeUnit.DAYS).build()
        manager.enqueueUniqueWork(DownloadWorker.NAME, ExistingWorkPolicy.KEEP, request)
    }
    fun cancel() { manager.cancelUniqueWork(DownloadWorker.NAME) }
    fun refresh() { viewModelScope.launch(Dispatchers.IO) { _history.value = HistoryStore(getApplication()).load() } }
}
