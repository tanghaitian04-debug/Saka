# 音频资源接口

当前版本不附带真实音乐或音效，缺少文件时不会请求空地址，也不会抛出脚本错误。

后续可把音频放入以下目录：

- `assets/audio/music/`：章节背景音乐，建议 OGG + MP3。
- `assets/audio/ambience/`：风、雨、脚步、人群、远炮、火车、电报机等环境音。
- `assets/audio/sfx/`：纸张、车轮、木梁、按钮等短音效。
- `assets/audio/voice/`：可选对白音频。

在事件数据的 `audio.ambience`、`audio.sfx` 字段填写相对路径即可；对白音频可调用 `ChengshangAudio.playVoice(path)`。音频管理器支持独立声道、静音、循环与淡入淡出。
