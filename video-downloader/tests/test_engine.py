import importlib.util
import pathlib
import unittest
import ssl
import json

spec = importlib.util.spec_from_file_location('engine', pathlib.Path(__file__).parents[1] / 'app/src/main/python/engine.py')
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


def fmt(fid='137', **changes):
    data = dict(format_id=fid, ext='mp4', vcodec='avc1', acodec='none', height=1080,
                url='https://cdn.example/video.mp4', protocol='https')
    data.update(changes)
    return data


class PolicyTests(unittest.TestCase):
    def test_all_platforms(self):
        for host in engine.HOSTS:
            self.assertEqual(engine.validate_url(f'https://{host}/watch/123'), f'https://{host}/watch/123')
    def test_reject_impostor_and_private_urls(self):
        for url in ['https://youtube.com.evil.test/x', 'file:///tmp/a', 'http://x.com/a',
                    'https://127.0.0.1/a', 'https://evil@x.com/a', 'https://x.com:8080/a']:
            with self.assertRaises(ValueError, msg=url): engine.validate_url(url)
    def test_pair_video_and_audio(self):
        info = {'formats': [fmt(), fmt('140', ext='m4a', vcodec='none', acodec='mp4a', abr=128)]}
        self.assertEqual(engine.choices(info)[0]['audio'], '140')
    def test_progressive_format_needs_no_audio(self):
        self.assertEqual(engine.choices({'formats': [fmt(acodec='mp4a')]})[0]['audio'], '')
    def test_drm_never_selected(self):
        with self.assertRaises(ValueError): engine.choices({'formats': [fmt(acodec='aac', has_drm=True)]})
        with self.assertRaises(ValueError): engine.choices({'has_drm': True, 'formats': [fmt(acodec='aac')]})
    def test_video_only_without_audio_is_rejected(self):
        with self.assertRaises(ValueError): engine.choices({'formats': [fmt()]})
    def test_injected_selector_is_rejected(self):
        with self.assertRaises(ValueError): engine.choices({'formats': [fmt('137+140', acodec='aac')]})
    def test_playlist_and_live_rejected(self):
        for extra in ({'_type': 'playlist'}, {'is_live': True}, {'entries': []}):
            with self.assertRaises(ValueError): engine.choices(dict(formats=[fmt(acodec='aac')], **extra))
    def test_forbidden_protocol(self):
        with self.assertRaises(ValueError): engine.choices({'formats': [fmt(acodec='aac', protocol='rtmp')]})
    def test_security_options(self):
        opts = engine.options('/native/qjs', '/tmp/cache')
        self.assertEqual(opts['remote_components'], set())
        self.assertFalse(opts['skip_unavailable_fragments'])
        self.assertNotIn('allow_unplayable_formats', opts)
        self.assertNotIn('cookiefile', opts)
    def test_real_python_dependencies_import(self):
        import yt_dlp, requests, yt_dlp_ejs
        self.assertGreater(len(list(yt_dlp.list_extractor_classes())), 100)
        self.assertTrue(ssl.create_default_context().get_ca_certs())
        self.assertEqual(yt_dlp.version.__version__, '2026.08.19')

if __name__ == '__main__': unittest.main()
