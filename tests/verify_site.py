"""Acceptance contracts for the actual Quarto output (run after scripts/build.py)."""
import json, sys, subprocess, os, shutil
from pathlib import Path
from urllib.parse import urlparse, unquote
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup

root = Path(sys.argv[1] if len(sys.argv) > 1 else '_site')
assert (root/'publication.json').exists(), 'Build must produce a publication manifest'
manifest = json.loads((root/'publication.json').read_text())
base = manifest['siteUrl']
checks = 0
for page in manifest['pages']:
    path = root/page['path']
    soup = BeautifulSoup(path.read_text(), 'html.parser')
    assert soup.html['lang'] == page['lang']
    assert len(soup.select('title')) == 1
    assert len(soup.select('meta[name=description]')) == 1
    assert len(soup.select('link[rel=canonical]')) == 1
    assert len(soup.select('meta[property="og:url"]')) == 1
    assert soup.title and soup.find('meta', attrs={'name':'description'})
    assert soup.find('link', rel='canonical')['href'] == page['url']
    assert soup.find('meta', property='og:url')['content'] == page['url']
    assert soup.find('meta', attrs={'name':'twitter:card'})
    alternates = {x['hreflang']: x['href'] for x in soup.select('link[hreflang]')}
    assert set(alternates) == {'en','zh-CN','x-default'}
    assert alternates[page['lang']] == page['url']
    pair = {p['lang']:p['url'] for p in manifest['pages'] if p['id']==page['id']}
    assert alternates == {**pair,'x-default':pair['en']}
    assert len(soup.select('link[hreflang]')) == 3
    assert bool(soup.select_one('meta[name=robots]')) == manifest['preview']
    assert soup.select_one('script[type="application/ld+json"]')
    md = (root/page['markdown']).read_text()
    assert manifest['revision'] in md and page['url'] in md
    import re
    quarto=os.environ.get('QUARTO_BIN') or shutil.which('quarto') or str(Path(__file__).resolve().parents[1]/'.tools/bin/quarto')
    parsed=subprocess.run([quarto,'pandoc','--from=commonmark','--to=plain','--wrap=none'],input=md,text=True,capture_output=True,check=True).stdout
    normalized_md = re.sub(r'\s+','',parsed)
    content = soup.select_one('main')
    # Compare actual substantive paragraphs/card descriptions and status against the derived mirror.
    substantive = content.select('p, .bxd, .bxk, .soon, .nyx-tagline, .heca-tagline, small')
    for node in substantive:
        if node.find_parent(['nav']) or node.find_parent(class_='lang-switch') or node.get('class')==['lang-switch']:continue
        if node.find(['a','code','em','strong','sup','span']):continue
        value=re.sub(r'\s+','',node.get_text(' ',strip=True))
        if len(value)>8:assert value in normalized_md, f'{page["path"]}: mirror missing {value[:60]}'
    assert '<div' not in md and '<main' not in md
    if page['id']=='home':
        assert ('Coming soon' if page['lang']=='en' else '即将推出') in md
        assert ('NyxBot, the main agent' if page['lang']=='en' else 'NyxBot 是 NyxID') in md
    else:
        anchors=json.loads(soup.select_one('#locale-anchors').string)
        other=next(p for p in manifest['pages'] if p['id']==page['id'] and p['lang']!=page['lang'])
        other_soup=BeautifulSoup((root/other['path']).read_text(),'html.parser')
        for source,target in anchors.items():
            assert soup.find(id=source) and other_soup.find(id=target)
    assert len(soup.select_one('main').get_text(strip=True)) > 100
    for node in soup.select('[href], [src], [data-src], [data-us-project-src]'):
        for attr in ('href','src','data-src','data-us-project-src'):
            if not node.has_attr(attr): continue
            url = urlparse(node[attr])
            if url.scheme or url.netloc or not url.path: continue
            target = (root/unquote(url.path).removeprefix(manifest['basePath'])) if url.path.startswith('/') else path.parent/unquote(url.path)
            if target.is_dir(): target = target/'index.html'
            assert target.exists(), f'{path}: missing {node[attr]} → {target}'
    checks += 1
urls = {x.text for x in ET.parse(root/'sitemap.xml').findall('.//{*}loc')}
assert urls == {p['url'] for p in manifest['pages']}
assert not any('/read/' in x for x in urls)
assert 'localhost' not in (root/'sitemap.xml').read_text()
assert len(manifest['aliases']) == 6
for alias, target in manifest['aliases'].items():
    soup = BeautifulSoup((root/alias).read_text(), 'html.parser')
    assert soup.select_one('meta[name=robots]')['content'] == 'noindex,follow'
    assert soup.select_one('link[rel=canonical]')['href'] == base + (target[:-10] if target.endswith('index.html') else target)
    assert soup.select_one('a')['href']
assert not (root/'AGENTS.md').exists() and not (root/'scripts').exists()
print(f'PASS: {checks} canonical pages, reciprocal locale metadata, JSON-LD, mirrors, all local assets/links, aliases and sitemap')
