import copy
import importlib.util
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('video_content',ROOT/'scripts/video_content.py');video=importlib.util.module_from_spec(spec);spec.loader.exec_module(video)

class VideoContract(unittest.TestCase):
    def setUp(self):self.config=video.read_videos(ROOT/'content/videos.json')
    def test_independent_locale_sources(self):
        config=copy.deepcopy(self.config);config['videos']['case']['sources']['zh']['id']='ilKLSItmT0M'
        self.assertNotEqual(video.watch_url(config,'case','en'),video.watch_url(config,'case','zh'))
        localized=video.locale_video_config(config,'zh',lambda path:'../'+path)
        self.assertEqual(localized['videos']['case']['poster'],'../assets/poster-zh.jpg')
    def test_unknown_provider_invalid_id_timeout_and_endpoint_fail_closed(self):
        for field,value in [('provider','bilibili'),('id','bad')]:
            config=copy.deepcopy(self.config);config['videos']['case']['sources']['zh'][field]=value
            with self.assertRaises(ValueError):video.validate_videos(config)
        for field,value in [('apiUrl','http://example.test/api'),('loadTimeoutMs',0)]:
            config=copy.deepcopy(self.config);config['providers']['youtube'][field]=value
            with self.assertRaises(ValueError):video.validate_videos(config)
    def test_disable_is_valid_configuration(self):
        config=copy.deepcopy(self.config);config['providers']['youtube']['enabled']=False
        self.assertFalse(video.validate_videos(config)['providers']['youtube']['enabled'])

if __name__=='__main__':unittest.main()
