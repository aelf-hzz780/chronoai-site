import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('chrono_build',ROOT/'scripts/build.py');build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)

class PublicationContracts(unittest.TestCase):
    def test_canonical_directory_urls(self):
        config=build.load_configuration()
        self.assertEqual(build.canonical(config,'zh/index.html'),config['siteUrl']+'zh/')
        self.assertEqual(build.relative('assets/site.css','zh/index.html'),'../assets/site.css')

    def test_invalid_deployment_settings_fail_closed(self):
        for variable,value in [('SITE_ORIGIN','http://insecure.example'),('SITE_ORIGIN','https://example.com/path'),('SITE_BASE_PATH','relative/'),('SITE_BASE_PATH','/../'),('SITE_BASE_PATH','/x?query/')]:
            with self.subTest(variable=variable,value=value),patch.dict(os.environ,{variable:value}):
                with self.assertRaises(ValueError):build.load_configuration()

    def test_original_research_bodies_and_dates_are_preserved(self):
        for stem in ('nyxid','ornn','harness','philosophy','nyxid-dossier'):
            for suffix in ('','-zh'):
                name=stem+suffix+'.qmd'
                baseline=subprocess.check_output(['git','show','1317113:'+name],cwd=ROOT,text=True)
                original=baseline[4:].split('---',1)[1].strip()
                meta,body=build.read_qmd(name)
                self.assertEqual(original,body.strip())
                if stem=='nyxid-dossier':
                    self.assertEqual(str(meta['date']),'2026-04-01')
                    self.assertEqual(meta['author'],'Chrono AI')

    def test_only_approved_sources_are_published(self):
        entries=json.loads((ROOT/'content/publication.json').read_text())
        self.assertEqual(len(entries),9)
        self.assertEqual(len({e[lang] for e in entries for lang in ('en','zh')}),18)
        self.assertIn('harness',{e['id'] for e in entries})
        self.assertEqual({build.route(e['id'],'en') for e in entries if e['kind']=='brand'}, {'products/nyxid.html','products/ornn.html','company.html'})
        self.assertEqual(build.route('nyxid','en'),'nyxid.html')
        self.assertEqual(build.route('nyxid-product','zh'),'zh/products/nyxid.html')

if __name__=='__main__':unittest.main()
