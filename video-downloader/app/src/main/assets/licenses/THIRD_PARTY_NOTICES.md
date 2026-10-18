# Third-party components

- App source: Apache License 2.0. See https://www.apache.org/licenses/LICENSE-2.0 .
- yt-dlp: Unlicense, https://github.com/yt-dlp/yt-dlp . yt-dlp-ejs: see https://github.com/yt-dlp/ejs .
- Chaquopy: MIT, https://github.com/chaquo/chaquopy . Python: PSF license, https://docs.python.org/3/license.html .
- FFmpeg 7.1.3: LGPL 2.1 or later, https://ffmpeg.org/releases/ffmpeg-7.1.3.tar.xz . No GPL/nonfree configuration enabled.
- QuickJS-NG 0.10.1: MIT, https://github.com/quickjs-ng/quickjs/tree/v0.10.1 .
- AndroidX, Kotlin, Coil: Apache 2.0. Requests: Apache 2.0. certifi: MPL 2.0.

FFmpeg and QuickJS license texts are packaged in APK assets/licenses. Their corresponding unmodified source archives,
exact downloaded SHA256 values, and build recipe are provided alongside the APK as the Verification artifact.
FFmpeg is a separately invoked executable: replacing/rebuilding it does not require linking proprietary app object files.
The complete app source and the native build script permit rebuilding and re-signing a modified APK.
No warranty. Maintain dependency security updates before distributing a production release.
