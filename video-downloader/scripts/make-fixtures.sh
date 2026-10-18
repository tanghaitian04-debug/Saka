#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p app/src/androidTest/assets
ffmpeg -v error -y -f lavfi -i color=c=blue:s=160x90:r=24 -t 1 -c:v mpeg4 -an app/src/androidTest/assets/video.mp4
ffmpeg -v error -y -f lavfi -i sine=frequency=440:sample_rate=44100 -t 1 -c:a aac -vn app/src/androidTest/assets/audio.m4a
