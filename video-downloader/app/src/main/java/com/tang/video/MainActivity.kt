package com.tang.video

import android.Manifest
import android.content.Intent
import android.content.ClipDescription
import android.content.ClipboardManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.work.WorkInfo
import coil.compose.AsyncImage
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    private val notificationPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(primary = Color(0xFF69D9CA), background = Color(0xFF0B101A), surface = Color(0xFF141E2B))) {
                val vm: MainViewModel = viewModel()
                LaunchedEffect(Unit) { if (intent.action == Intent.ACTION_SEND) vm.edit(intent.getStringExtra(Intent.EXTRA_TEXT) ?: "") }
                DownloaderScreen(vm) { if (Build.VERSION.SDK_INT >= 33) notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DownloaderScreen(vm: MainViewModel, requestPermission: () -> Unit) {
    val input by vm.input.collectAsStateWithLifecycle()
    val video by vm.video.collectAsStateWithLifecycle()
    val loading by vm.loading.collectAsStateWithLifecycle()
    val message by vm.message.collectAsStateWithLifecycle()
    val history by vm.history.collectAsStateWithLifecycle()
    val work by vm.work.collectAsStateWithLifecycle()
    val busy = work?.state?.isFinished == false
    val context = LocalContext.current
    var page by remember { mutableIntStateOf(0) }
    var selected by remember(video) { mutableIntStateOf(0) }
    var consent by rememberSaveableCompat()
    Scaffold(topBar = { TopAppBar(title = { Column { Text("Video Downloader"); Text("公开视频 · 本地解析", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary) } }) }) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                TabRow(page) {
                    Tab(page == 0, onClick = { page = 0 }, text = { Text("下载视频") })
                    Tab(page == 1, onClick = { page = 1; vm.refresh() }, text = { Text("下载历史") })
                }
            }
            if (page == 0) {
                item { Text("保存你有权下载的视频", style = MaterialTheme.typography.headlineSmall) }
                item { Text("YouTube / X / TikTok / Bilibili / Instagram", style = MaterialTheme.typography.bodySmall) }
                item {
                    OutlinedTextField(value = input, onValueChange = vm::edit, modifier = Modifier.fillMaxWidth(), label = { Text("粘贴视频链接或分享文字") }, minLines = 3, maxLines = 5, enabled = !loading && !busy)
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(enabled = !loading && !busy, onClick = {
                            val clipboard = context.getSystemService(ClipboardManager::class.java)
                            val text = clipboard.primaryClip?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.coerceToText(context)?.toString()
                            if (text != null) vm.edit(text)
                        }) { Text("粘贴") }
                        Button(enabled = input.isNotBlank() && !loading && !busy, onClick = vm::parse, modifier = Modifier.weight(1f)) { Text(if (loading) "正在解析…" else "解析视频") }
                    }
                }
                if (loading) item { LinearProgressIndicator(Modifier.fillMaxWidth()); Text("正在读取标题、封面和画质，请稍候…") }
                if (message.isNotBlank()) item { Text(message, color = MaterialTheme.colorScheme.error) }
                video?.let { v ->
                    item {
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                if (v.thumbnail.startsWith("https://")) AsyncImage(model = v.thumbnail, contentDescription = "视频封面", modifier = Modifier.fillMaxWidth().height(190.dp))
                                Text(v.title, style = MaterialTheme.typography.titleMedium)
                                Text("时长 ${v.duration / 60}:${(v.duration % 60).toString().padStart(2, '0')} · MP4", style = MaterialTheme.typography.bodySmall)
                                Text("选择画质")
                                v.choices.forEachIndexed { index, quality ->
                                    Row {
                                        RadioButton(selected == index, onClick = { selected = index }, enabled = !busy)
                                        TextButton(onClick = { selected = index }, enabled = !busy) {
                                            Text(quality.label + if (quality.bytes > 0) " · 约 ${quality.bytes / 1048576} MB" else "")
                                        }
                                    }
                                }
                                Row { Checkbox(consent, onCheckedChange = { consent = it }); Text("我拥有此内容的下载权利", Modifier.padding(top = 12.dp)) }
                                Button(enabled = consent && !busy, onClick = { requestPermission(); vm.start(v.choices[selected]) }, modifier = Modifier.fillMaxWidth()) { Text("下载 MP4") }
                            }
                        }
                    }
                }
                item {
                    Text("保存位置：下载 / Video Downloader\n仅处理可公开访问的内容。登录、地区限制、DRM 或平台风控可能导致失败；应用不会尝试绕过。", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                if (history.isEmpty()) item { Text("还没有下载记录") }
                items(history) { h ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(h.title, style = MaterialTheme.typography.titleMedium)
                            Text("${h.status} · ${SimpleDateFormat("MM-dd HH:mm", Locale.CHINA).format(Date(h.time))}")
                            Text(h.detail, style = MaterialTheme.typography.bodySmall)
                            if (h.uri.isNotEmpty()) TextButton(onClick = {
                                try { context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(Uri.parse(h.uri), "video/mp4").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)) }
                                catch (_: Exception) { Toast.makeText(context, "文件已被移除或没有可用播放器", Toast.LENGTH_SHORT).show() }
                            }) { Text("打开视频") }
                        }
                    }
                }
            }
            work?.let { w ->
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            val text = when (w.state) {
                                WorkInfo.State.ENQUEUED, WorkInfo.State.BLOCKED -> "等待网络或下载调度"
                                WorkInfo.State.SUCCEEDED -> "下载完成"
                                WorkInfo.State.FAILED -> w.outputData.getString("phase") ?: "下载失败"
                                WorkInfo.State.CANCELLED -> "下载已取消"
                                else -> w.progress.getString("phase") ?: "正在准备下载"
                            }
                            Text(text)
                            if (!w.state.isFinished) {
                                val progress = w.progress.getInt("percent", 0)
                                LinearProgressIndicator(progress = { progress / 100f }, modifier = Modifier.fillMaxWidth())
                                Text("$progress%（包含下载、合并、保存阶段）")
                                TextButton(onClick = vm::cancel) { Text("取消下载") }
                            }
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun rememberSaveableCompat() = androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf(false) }
