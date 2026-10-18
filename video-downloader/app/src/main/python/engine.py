"""Android in-process extraction. No cookies, credentials, DRM override or remote code downloads."""
import json
import os
import re
from urllib.parse import urlparse

HOSTS = ('youtube.com', 'youtu.be', 'x.com', 'twitter.com', 'tiktok.com',
         'bilibili.com', 'b23.tv', 'instagram.com')
PROTOCOLS = {'https', 'http', 'http_dash_segments', 'm3u8_native', 'm3u8'}


def validate_url(value):
    value = value.strip()
    p = urlparse(value)
    host = (p.hostname or '').lower()
    if (p.scheme != 'https' or p.username or p.password or p.port not in (None, 443)
            or not any(host == h or host.endswith('.' + h) for h in HOSTS)):
        raise ValueError('请粘贴支持平台的 HTTPS 公开视频链接')
    return value


def allowed(f):
    return (not f.get('has_drm') and f.get('url') and
            f.get('protocol', 'https') in PROTOCOLS)


def choices(info):
    if info.get('has_drm'):
        raise ValueError('此视频受 DRM 保护，无法下载')
    if info.get('_type') in ('playlist', 'multi_video') or info.get('entries') is not None:
        raise ValueError('请提供单个视频链接，不支持播放列表或多视频帖子')
    if info.get('is_live'):
        raise ValueError('暂不支持正在直播的视频')
    formats = [f for f in info.get('formats', []) if allowed(f)]
    audio = [f for f in formats if f.get('vcodec') == 'none' and
             f.get('acodec') not in (None, 'none') and f.get('ext') == 'm4a']
    best_audio = max(audio, key=lambda f: f.get('abr') or f.get('tbr') or 0, default=None)
    result = []
    for f in formats:
        if f.get('ext') != 'mp4' or f.get('vcodec') in (None, 'none'):
            continue
        separate = f.get('acodec') in (None, 'none')
        if separate and best_audio is None:
            continue
        fid = str(f['format_id'])
        # IDs go to the exact yt-dlp format selector, never permit selector operators.
        if not re.fullmatch(r'[\w.-]+', fid):
            continue
        aid = str(best_audio['format_id']) if separate else ''
        if aid and not re.fullmatch(r'[\w.-]+', aid):
            continue
        size = f.get('filesize') or f.get('filesize_approx') or 0
        if separate:
            size += best_audio.get('filesize') or best_audio.get('filesize_approx') or 0
        result.append({'video': fid, 'audio': aid, 'height': f.get('height') or 0,
                       'label': f"{f.get('height') or '?'}p · {f.get('fps') or '?'}fps · MP4"
                                + ('（合并音轨）' if separate else ''), 'bytes': size})
    if not result:
        raise ValueError('未发现可下载的非 DRM MP4 音视频格式；可能需要登录或平台限制了访问')
    return sorted(result, key=lambda x: (x['height'], x['bytes']), reverse=True)


def options(qjs, cache):
    return {'noplaylist': True, 'socket_timeout': 25, 'retries': 2,
            'fragment_retries': 2, 'skip_unavailable_fragments': False,
            'quiet': True, 'no_warnings': False, 'cachedir': cache,
            'js_runtimes': {'quickjs': {'path': qjs}}, 'remote_components': set(),
            'hls_prefer_native': True, 'fixup': 'never', 'overwrites': True,
            'restrictfilenames': True, 'check_formats': False}


def inspect(url, qjs, cache):
    from yt_dlp import YoutubeDL
    with YoutubeDL(options(qjs, cache)) as ydl:
        info = ydl.extract_info(validate_url(url), download=False)
    return json.dumps({'title': info.get('title') or '视频',
                       'thumbnail': info.get('thumbnail') or '',
                       'duration': info.get('duration') or 0,
                       'choices': choices(info)}, ensure_ascii=False)


def download(url, video, audio, directory, qjs, cache, callback):
    from yt_dlp import YoutubeDL
    from yt_dlp.utils import DownloadError
    url = validate_url(url)
    opts = options(qjs, cache)
    with YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    if not any(c['video'] == video and c['audio'] == audio for c in choices(info)):
        raise ValueError('画质已失效，请重新解析')
    ids = [video] + ([audio] if audio else [])
    files = []
    for i, fid in enumerate(ids):
        def hook(d):
            if callback.cancelled():
                raise DownloadError('下载已取消')
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            fraction = min(1.0, d.get('downloaded_bytes', 0) / total) if total else 0
            callback.progress(int(90 * (i + fraction) / len(ids)), '正在下载视频' if i == 0 else '正在下载音轨')
        current = dict(opts, format=fid, outtmpl=os.path.join(directory, f'track{i}.%(ext)s'),
                       progress_hooks=[hook], postprocessors=[])
        with YoutubeDL(current) as ydl:
            # The public extractor is re-run to refresh expiring CDN links.
            data = ydl.extract_info(url, download=False)
            if not any(c['video'] == video and c['audio'] == audio for c in choices(data)):
                raise ValueError('视频格式发生变化，请重新解析')
            ydl.process_ie_result(data, download=True)
            path = ydl.prepare_filename(data)
        if not os.path.isfile(path):
            # Exact output basename only; never select a .part, metadata or unrelated file.
            candidates = [os.path.join(directory, f'track{i}.{ext}') for ext in ('mp4', 'm4a')]
            path = next((p for p in candidates if os.path.isfile(p)), '')
        if not path or os.path.getsize(path) == 0:
            raise ValueError('下载未生成完整文件')
        files.append(path)
    return json.dumps(files)


def self_test(qjs, cache):
    import ssl
    import subprocess
    import yt_dlp
    import yt_dlp_ejs
    import requests
    from yt_dlp.version import __version__
    assert ssl.create_default_context().get_ca_certs()
    assert len(list(yt_dlp.list_extractor_classes())) > 100
    result = subprocess.run([qjs, '-e', 'console.log(6*7)'], capture_output=True, text=True, timeout=15)
    assert result.returncode == 0 and result.stdout.strip() == '42', result.stderr
    return __version__
