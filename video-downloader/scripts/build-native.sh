#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
NDK_VERSION=28.1.13356709
: "${ANDROID_HOME:?Android SDK is required}"
ndk="${ANDROID_NDK_HOME:-$ANDROID_HOME/ndk/$NDK_VERSION}"
toolchain="$ndk/toolchains/llvm/prebuilt/linux-x86_64"
root="$PWD/.native"
mkdir -p "$root/src"
# Pinned upstream tags. Sources and exact hashes are shipped as build artifacts.
if [ ! -d "$root/src/ffmpeg" ]; then
  curl -fL --retry 3 https://ffmpeg.org/releases/ffmpeg-7.1.3.tar.xz -o "$root/ffmpeg.tar.xz"
  mkdir -p "$root/src/ffmpeg"
  tar --no-same-owner -xJf "$root/ffmpeg.tar.xz" --strip-components=1 -C "$root/src/ffmpeg"
fi
if [ ! -d "$root/src/quickjs" ]; then
  curl -fL --retry 3 https://github.com/quickjs-ng/quickjs/archive/refs/tags/v0.10.1.tar.gz -o "$root/quickjs.tar.gz"
  mkdir -p "$root/src/quickjs"
  tar --no-same-owner -xzf "$root/quickjs.tar.gz" --strip-components=1 -C "$root/src/quickjs"
fi
printf '%s  %s\n' 'f0bf043299db9e3caacb435a712fc541fbb07df613c4b893e8b77e67baf3adbe' "$root/ffmpeg.tar.xz" '4e917eea3bb6051a0551fdd3aac45199ff705fa08920c15b824a08c5fbb032e4' "$root/quickjs.tar.gz" | sha256sum --check
sha256sum "$root/ffmpeg.tar.xz" "$root/quickjs.tar.gz" > "$root/SOURCE_SHA256.txt"
for abi in arm64-v8a x86_64; do
  if [ "$abi" = arm64-v8a ]; then triple=aarch64-linux-android; arch=aarch64; cpu=armv8-a
  else triple=x86_64-linux-android; arch=x86_64; cpu=x86-64; fi
  dest="$PWD/app/src/main/jniLibs/$abi"
  mkdir -p "$dest" "$root/ffmpeg-$abi"
  (
    cd "$root/ffmpeg-$abi"
    "$root/src/ffmpeg/configure" --target-os=android --arch="$arch" --cpu="$cpu" \
      --enable-cross-compile --cc="$toolchain/bin/${triple}29-clang" \
      --cxx="$toolchain/bin/${triple}29-clang++" --ar="$toolchain/bin/llvm-ar" \
      --ranlib="$toolchain/bin/llvm-ranlib" --strip="$toolchain/bin/llvm-strip" \
      --sysroot="$toolchain/sysroot" --enable-pic --enable-static --disable-shared \
      --disable-autodetect --disable-doc --disable-debug --disable-network \
      --disable-everything --enable-ffmpeg --disable-ffprobe --disable-ffplay \
      --enable-protocol=file --enable-demuxer=mov,matroska,mpegts,aac \
      --enable-muxer=mp4 --enable-parser=h264,hevc,aac,av1 \
      --enable-bsf=aac_adtstoasc,extract_extradata \
      --disable-x86asm --extra-cflags='-fPIE' \
      --extra-ldflags='-pie -Wl,-z,max-page-size=16384'
    make -j"$(nproc)" ffmpeg
    cp ffmpeg "$dest/libvdffmpeg.so"
  )
  cmake -S "$root/src/quickjs" -B "$root/qjs-$abi" \
    -DCMAKE_TOOLCHAIN_FILE="$ndk/build/cmake/android.toolchain.cmake" \
    -DANDROID_ABI="$abi" -DANDROID_PLATFORM=android-29 -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_EXE_LINKER_FLAGS='-Wl,-z,max-page-size=16384' \
    -DBUILD_SHARED_LIBS=OFF -DQJS_BUILD_EXAMPLES=OFF
  cmake --build "$root/qjs-$abi" --target qjs_exe -j"$(nproc)"
  cp "$root/qjs-$abi/qjs" "$dest/libvdqjs.so"
  "$toolchain/bin/llvm-strip" "$dest/"*.so
  "$toolchain/bin/llvm-readelf" -h -l "$dest/libvdffmpeg.so" > "$root/elf-$abi.txt"
  file "$dest/"*.so
 done
mkdir -p app/src/main/assets/licenses
cp "$root/src/ffmpeg/COPYING.LGPLv2.1" app/src/main/assets/licenses/FFmpeg-LGPL-2.1.txt
cp "$root/src/quickjs/LICENSE" app/src/main/assets/licenses/QuickJS-LICENSE.txt
