"""Real yt-dlp HTTP downloader, with an isolated fixture extractor/CDN (no live sites)."""
import contextlib
import http.server
import json
import pathlib
import tempfile
import threading
import unittest
from unittest.mock import patch

from test_engine import engine
from yt_dlp import YoutubeDL as RealYoutubeDL
from yt_dlp.extractor.common import InfoExtractor
from yt_dlp.utils import DownloadError


class TransferTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                body = (b'video-fixture' if self.path == '/v.mp4' else b'audio-fixture') * 2048
                self.send_response(200)
                self.send_header('Content-Type', 'video/mp4')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            def log_message(self, *args): pass
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def factory(self, opts):
        origin = f'http://127.0.0.1:{self.server.server_port}'
        class FixtureIE(InfoExtractor):
            _VALID_URL = r'https://youtube\.com/fixture/(?P<id>\w+)'
            def _real_extract(self, url):
                return {'id': self._match_id(url), 'title': 'Fixture', 'formats': [
                    {'format_id': 'v1', 'url': origin + '/v.mp4', 'ext': 'mp4', 'vcodec': 'avc1', 'acodec': 'none', 'height': 1080},
                    {'format_id': 'a1', 'url': origin + '/a.m4a', 'ext': 'm4a', 'vcodec': 'none', 'acodec': 'mp4a', 'abr': 128}]}
        ydl = RealYoutubeDL(dict(opts, proxy='', noprogress=True), auto_init=False)
        ydl.add_info_extractor(FixtureIE())
        return ydl

    def test_exact_tracks_download_with_real_http_downloader(self):
        class Callback:
            updates = []
            def cancelled(self): return False
            def progress(self, value, phase): self.updates.append(value)
        cb = Callback()
        with tempfile.TemporaryDirectory() as folder, patch('yt_dlp.YoutubeDL', side_effect=self.factory):
            files = json.loads(engine.download('https://youtube.com/fixture/test', 'v1', 'a1', folder, '/unused', folder, cb))
            self.assertEqual(len(files), 2)
            self.assertEqual(pathlib.Path(files[0]).read_bytes(), b'video-fixture' * 2048)
            self.assertEqual(pathlib.Path(files[1]).read_bytes(), b'audio-fixture' * 2048)
            self.assertTrue(cb.updates)
            self.assertEqual(cb.updates[-1], 90)

    def test_changed_quality_rejected_before_transfer(self):
        with tempfile.TemporaryDirectory() as folder, patch('yt_dlp.YoutubeDL', side_effect=self.factory):
            with self.assertRaisesRegex(ValueError, '画质已失效'):
                engine.download('https://youtube.com/fixture/test', 'missing', 'a1', folder, '/unused', folder, None)

    def test_cancel_interrupts_real_http_downloader(self):
        class Callback:
            def cancelled(self): return True
            def progress(self, *args): raise AssertionError('progress after cancellation')
        with tempfile.TemporaryDirectory() as folder, patch('yt_dlp.YoutubeDL', side_effect=self.factory):
            with self.assertRaises(DownloadError):
                engine.download('https://youtube.com/fixture/test', 'v1', 'a1', folder, '/unused', folder, Callback())

if __name__ == '__main__': unittest.main()
