# Video Downloader

原生 Android 10+ 视频下载器（Kotlin / Jetpack Compose / 中文深色界面）。

## 手机端构建及安装

在本仓库 `video-downloader-android` 分支提交修改后，GitHub Actions 自动执行。
打开仓库 **Actions → Video Downloader APK → 对应运行**，在 **Artifacts** 下载
`Video-Downloader-Debug-APK`，手机解压 ZIP 后安装 `app-debug.apk`。
在 Android 设置中允许当前浏览器或文件管理器“安装未知应用”。
支持 arm64-v8a 真机和 x86_64 模拟器，不支持 32 位 Android、iOS。
Debug APK 使用临时调试证书；跨 CI 构建安装时证书可能不同，可能需要卸载旧版本（会清除历史）。正式稳定更新需后续配置持久签名密钥。

## 功能

- 粘贴链接或通过系统分享文字接收 YouTube、X、TikTok、Bilibili、Instagram 链接。
- 在手机内通过 Chaquopy Python 3.13 调用 yt-dlp，显示标题、封面、时长和可用 MP4 画质。
- MP4 单文件或 MP4 视频 + M4A 音轨；不承诺平台的所有画质均可用。
- WorkManager 前台任务、通知进度和取消；失败原因、成功/失败/执行中取消历史（最多 200 条）。
- Android NDK 构建的 FFmpeg 在手机内无损合并/重新封装；不调用桌面 FFmpeg。
- 使用 MediaStore 的 IS_PENDING 原子发布到 `Download/Video Downloader`，失败清除未完成条目。
- 历史点击打开系统播放器。无需所有文件访问权限。

## 安全和平台边界

仅适用于用户有权下载的公开视频。拒绝已标记 DRM 格式，不提供登录、Cookie 导入、代理、访问控制绕过功能。
平台风控、地区限制、登录要求、格式变化和网络环境可能使公开视频也无法解析。
只支持单个非直播视频；不支持播放列表、多个视频合集、WebM 转码和付费视频。
YouTube 所需 yt-dlp-ejs 和 Android QuickJS 已纳入依赖；实际站点能否下载必须按真实链接验证。

## 依赖兼容性验证

Chaquopy 17.1.0 支持 Python 3.13，官方说明可安装纯 Python 包。本项目没有使用 `yt-dlp[default]`：
其中 curl_cffi / brotli 等原生扩展不能直接拿 Linux wheel 放进 Android。
采用固定版本 `yt-dlp==2026.8.19`、匹配的 `yt-dlp-ejs==0.8.0` 和 requests/certifi。
FFmpeg 7.1.3 和 QuickJS-NG 0.10.1 在 Actions 中通过 Android NDK 28 编译 arm64 和 x86_64 PIE 程序，
作为 `libvd*.so` 打包并通过 `nativeLibraryDir` 执行；没有从可写数据目录执行下载的程序。
FFmpeg 只开启本地文件协议与 MP4 合并所需组件，不启用 GPL 编解码器或网络协议。

验证分为三个层级，不能互相替代：

1. Python 策略测试和 JVM 链接/文件名测试。
2. APK 构建、Lint、Android 模拟器内 Python+SSL+提取器导入、QuickJS 执行、FFmpeg 运行、音视频合并与 MediaStore 读回测试。
3. 真机上针对五个平台的公开视频实测。此层需要合适网络及用户有权下载的测试链接，尚未自动证明。

具体当前运行结果见 `VERIFICATION.md` 和 Actions 测试报告。APK 构建通过不代表所有平台实测通过。

若 Chaquopy 方案在 Android 运行测试失败，应先修复失败模块；可替代方案是 youtubedl-android
的 Android Python/FFmpeg 打包库。切换前必须检查该库 Python 版本、16KB 页兼容性和当前 yt-dlp 支持，不能直接假定兼容。

## 云端开发

GitHub Actions 完成 NDK 源码编译、Python/JVM 测试、Lint、Debug APK 和 Android 仪器测试。
Gradle Wrapper 和 `gradle/actions/setup-gradle` 均固定 8.13。Java 17、Python 3.13、SDK 35、minSdk 29。
源码位于 `video-downloader/`，工作流位于 `.github/workflows/video-downloader.yml`。
可以在手机 GitHub 网页修改文件提交，不依赖本地电脑或 Android Studio。

FFmpeg 和 QuickJS 源码压缩包、构建时 SHA256 与 ELF 信息随 Verification 构建产物提供。
使用公开的 `scripts/build-native.sh` 可从相同源码重建/替换可执行组件；APK 为调试版，可重签名安装。
许可证说明见 `THIRD_PARTY_NOTICES.md`。
