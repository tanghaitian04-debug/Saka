# Verification status

Initial full CI run: https://github.com/tanghaitian04-debug/Saka/actions/runs/39155696595
Commit: 83618efe7e470ac3b0aa45c358e0db193fa4b873

Passed in GitHub Actions:
- Android NDK builds of FFmpeg 7.1.3 and QuickJS-NG 0.10.1, arm64-v8a and x86_64.
- Kotlin/Compose compilation, Debug APK assembly, Android test APK assembly.
- Android Lint and six JVM policy tests.
- Android API 35 x86_64 emulator: Python + SSL + yt-dlp imports and QuickJS execution.
- Android emulator: native FFmpeg execution, separate audio/video merge with both tracks inspected using MediaExtractor.
- Android emulator: MediaStore Downloads publication, byte-size readback, IS_PENDING cleared and cancelled-save cleanup.
- Host Python policy/dependency tests.

Follow-up changes add real HTTP fixture transfer/cancellation coverage (14 host Python tests total),
UI activity-launch smoke test, EJS package-data/runtime detection checks, source SHA256 verification,
bounded input length, improved Chinese errors and latest-task selection.
The follow-up CI run must pass before delivering its APK as the current build.

NOT VERIFIED:
- Physical arm64 Android device.
- End-to-end downloads from live YouTube, X, TikTok, Bilibili or Instagram links.
- Device-specific codecs, OEM background restrictions and Android 16 KB-page runtime.
- Android API 29 minimum-version runtime. Emulator coverage is API 35 only.

No claim of universal platform availability is made. Platform/network/login/region restrictions remain enforced.
Native ELF LOAD segments are 16 KB aligned; this is a binary inspection, not a 16 KB-device runtime test.
