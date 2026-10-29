import hashlib
import importlib.util
import json
from pathlib import Path
import unittest
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('brand_build',ROOT/'scripts/build.py')
build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)


class FrozenBrandPages(unittest.TestCase):
    def test_frozen_sources_match_recorded_hashes(self):
        for source in json.loads((ROOT/'content/brand/sources.json').read_text()):
            with self.subTest(source=source['url']):
                raw=(ROOT/source['file']).read_bytes()
                self.assertEqual(hashlib.sha256(raw).hexdigest(),source['sha256'])
                self.assertEqual(len(raw),source['bytes'])

    def test_brand_routes_and_locale_links_do_not_replace_articles(self):
        config=build.load_configuration()
        for entry in build.ENTRIES:
            if entry['kind']!='brand':continue
            for language in ('en','zh'):
                current=build.route(entry['id'],language)
                soup=BeautifulSoup(build.brand_body(ROOT,entry,language,current,config,build.route,build.relative),'html.parser')
                self.assertEqual(len(soup.select('main h1')),1)
                self.assertTrue(soup.select('main [data-locale-section]'))
                self.assertFalse(soup.select('script[src*="http"],a[href*="cdn-cgi"]'))
                for link in soup.select('a[data-locale]'):
                    self.assertEqual((ROOT/Path(current).parent/link['href']).resolve(),(ROOT/build.route(entry['id'],link['data-locale'])).resolve())
                for link in soup.select('header a,footer a'):
                    self.assertNotIn('philosophy.html',link.get('href',''))


if __name__=='__main__':unittest.main()
