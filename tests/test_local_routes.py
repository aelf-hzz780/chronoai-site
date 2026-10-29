"""Regression contracts for every approved official page staying in the selected locale."""
import importlib.util
from pathlib import Path
import unittest
import tempfile
import hashlib
from urllib.parse import urlparse, urljoin, parse_qs
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('local_route_build',ROOT/'scripts/build.py')
build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
APPROVED={'products/nyxid.html','products/ornn.html','company.html','products/cma.html','products/godgpt.html','research.html','developers.html','products.html'}


class LocalOfficialRoutes(unittest.TestCase):
    def assert_local(self, markup, context):
        soup=BeautifulSoup(markup,'html.parser')
        host=urlparse(build.load_configuration()['onlineOrigin']).netloc
        leaked=[a['href'] for a in soup.select('a[href]') if urlparse(a['href']).netloc==host]
        self.assertEqual(leaked,[],context+': official-site destinations must stay local')

    def test_all_approved_official_routes_are_declared(self):
        self.assertEqual({e['path'] for e in build.ENTRIES if e['kind']=='brand'},APPROVED)

    def test_home_entries_stay_in_the_selected_locale(self):
        config=build.load_configuration()
        for language in ('en','zh'):
            self.assert_local(build.home_body(language,build.route('home',language),config),'home '+language)

    def test_brand_menus_cards_cta_and_all_products_stay_local(self):
        config=build.load_configuration()
        for entry in build.ENTRIES:
            if entry['kind']!='brand':continue
            for language in ('en','zh'):
                self.assert_local(build.brand_body(ROOT,entry,language,build.route(entry['id'],language),config,build.route,build.relative),entry['id']+' '+language)

    def test_localization_preserves_query_fragment_and_service_links(self):
        config=build.load_configuration()
        markup='<a href="../products.html?tag=1&amp;tag=2#heca" target="_blank">Products</a><a href="https://nyx.chrono-ai.fun/docs?lang=en#setup">Docs</a><pre><code><a href="https://chrono-ai.fun/research.html">example</a></code></pre>'
        soup=BeautifulSoup(markup,'html.parser')
        build.localize_links(soup,config['onlineOrigin']+'/products/cma.html','zh/products/cma.html','zh',config,build.ENTRIES,build.route,build.relative)
        self.assertEqual(urljoin('https://local.example/base/zh/products/cma.html',soup.a['href']),'https://local.example/base/zh/products.html?tag=1&tag=2#heca')
        self.assertFalse(soup.a.has_attr('target'))
        self.assertEqual(soup.select('a')[1]['href'],'https://nyx.chrono-ai.fun/docs?lang=en#setup')
        self.assertEqual(soup.select_one('pre a')['href'],'https://chrono-ai.fun/research.html')

    def test_preview_asset_versions_match_bytes_without_losing_query(self):
        with tempfile.TemporaryDirectory() as directory:
            output=Path(directory);(output/'assets').mkdir();(output/'zh').mkdir()
            raw=b'window.localeReady=true;';(output/'assets/locale.js').write_bytes(raw)
            soup=BeautifulSoup('<script src="../assets/locale.js?feature=1&amp;feature=2#ready"></script><script src="https://example.org/external.js"></script>','html.parser')
            build.version_preview_assets(soup,'zh/index.html',output,build.load_configuration())
            address=urlparse(soup.script['src'])
            self.assertEqual(parse_qs(address.query),{'feature':['1','2'],'v':[hashlib.sha256(raw).hexdigest()[:12]]})
            self.assertEqual(address.fragment,'ready')
            self.assertEqual(soup.select('script')[1]['src'],'https://example.org/external.js')


if __name__=='__main__':unittest.main()
