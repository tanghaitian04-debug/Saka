# Verification

Build commit: fb00503f27f52d47c6f691cd8c0a1cbc0dfca24c
Successful workflow: https://github.com/tanghaitian04-debug/Saka/actions/runs/39157727183
Debug APK: https://github.com/tanghaitian04-debug/Saka/actions/runs/39157727183/artifacts/12147397442
Verification reports and native sources: https://github.com/tanghaitian04-debug/Saka/actions/runs/39157727183/artifacts/12147862404
Completed: 2026-10-18 UTC / 2026-10-19 Asia/Shanghai.

## Passed

- 15 host Python tests: link and DRM policies, MP4 selection including unknown codecs, dependencies/EJS data, real HTTP fixture audio/video transfers, invalid quality and cancellation.
- Six JVM tests: shared-text links, supported subdomains, URL rejection and safe filenames.
- Five Android API 35 x86_64 emulator tests: Compose activity/WorkManager startup; Python+SSL+yt-dlp+EJS and QuickJS detection/execution; Android FFmpeg startup; audio/video merge with MediaExtractor and MediaStore Downloads byte-size/pending-flag readback; cancelled-save exception handling.
- Kotlin/Compose compilation, Debug APK and instrumented test APK assembly, Android Lint.
- Android NDK 28 builds of FFmpeg 7.1.3 and QuickJS-NG 0.10.1 for arm64-v8a and x86_64, with source SHA256 checks.
- Codex Cloud independently assembled the APK, passed six JVM tests and Lint, and verified the APK signature.

No post-test application launch is required: the Android test runner may uninstall the target app during cleanup.

## Not verified

- Physical arm64 devices and real-world background downloads.
- Live YouTube, X, TikTok, Bilibili or Instagram downloads. Extractors are integrated; live availability and each format are not guaranteed.
- OEM restrictions, device codecs and 16 KB-page Android runtime.
- Minimum Android API 29 runtime; emulator coverage is API 35 only.

Native ELF load segments were inspected for 16 KB alignment; this does not substitute for device runtime testing.
No DRM override, Cookie import, login/region bypass or private-content access is implemented.
This is a Debug test build. CI debug signing keys may differ across builds; see README installation notes.
