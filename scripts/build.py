#!/usr/bin/env python3
"""Build the explicit bilingual publication set through Quarto, then derive representations."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import uuid
from urllib.parse import urljoin, urlparse
from xml.etree.ElementTree import Element, SubElement, ElementTree

from bs4 import BeautifulSoup
import yaml

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT/'.build'
sys.path.insert(0, str(ROOT/'scripts'))
from video_content import read_videos, watch_url, locale_video_config
from brand_content import brand_body, translate, localize_links

ENTRIES = json.loads((ROOT/'content/publication.json').read_text())
ROUTES = {entry['id']: entry.get('path', 'index.html' if entry['id']=='home' else entry['id']+'.html') for entry in ENTRIES}


def load_configuration():
    config = json.loads((ROOT/'site-config.json').read_text())
    config['origin'] = os.environ.get('SITE_ORIGIN', config['origin']).rstrip('/')
    config['basePath'] = os.environ.get('SITE_BASE_PATH', config['basePath'])
    origin = urlparse(config['origin'])
    if origin.scheme != 'https' or not origin.netloc or origin.path or origin.query or origin.fragment:
        raise ValueError('SITE_ORIGIN must be an HTTPS origin without a path')
    base = config['basePath']
    if not base.startswith('/') or not base.endswith('/') or any(x in base for x in ('..','?','#','//')):
        raise ValueError('SITE_BASE_PATH must be a normalized absolute directory path')
    config['siteUrl'] = config['origin'] + base
    config['videosConfig'] = read_videos(ROOT/'content/videos.json')
    return config


def route(identifier, language):
    return ('zh/' if language == 'zh' else '') + ROUTES[identifier]


def canonical(config, path):
    return config['siteUrl'] + (path[:-10] if path.endswith('index.html') else path)


def relative(target, current):
    return os.path.relpath(target, str(Path(current).parent)).replace(os.sep, '/')


def read_qmd(name):
    raw = (ROOT/name).read_text()
    header, body = raw[4:].split('---', 1)
    return yaml.safe_load(header), body


def source_revision():
    paths = sorted([*ROOT.glob('*.qmd'), *[p for folder in ('content','assets','templates','scripts') for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts], ROOT/'site-config.json', ROOT/'_quarto.yml', ROOT/'styles.css'])
    digest = hashlib.sha256()
    for path in paths:
        digest.update(path.relative_to(ROOT).as_posix().encode()+b'\0'+path.read_bytes()+b'\0')
    return digest.hexdigest()


def resolve_tokens(source, language, current, config):
    def substitute(match):
        kind, key = match.groups()
        if kind == 'video': return watch_url(config['videosConfig'], key, language)
        if kind == 'asset': return relative('assets/'+key, current)
        if kind == 'page': return relative(route(key, language), current)
        if kind == 'locale': return relative(route('home', key), current)
        if kind == 'external': return config['external'][key]
        raise ValueError('Unknown template token')
    return re.sub(r'\[\[(asset|page|locale|external|video):([^\]]+)\]\]', substitute, source)


def home_body(language, current, config):
    soup = BeautifulSoup((ROOT/'content/home.html').read_text(), 'html.parser')
    soup.append(BeautifulSoup((ROOT/'templates/video-dialog.html').read_text(), 'html.parser'))
    if language == 'zh':
        translations = json.loads((ROOT/'content/home.zh.json').read_text())
        for node in soup.find_all(string=True):
            key = str(node).strip()
            if key in translations: node.replace_with(str(node).replace(key, translations[key]))
        for node in soup.select('[aria-label], [data-us-alttext], [alt]'):
            for attr in ('aria-label','data-us-alttext','alt'):
                if node.get(attr) in translations: node[attr] = translations[node[attr]]
    for anchor in soup.select('a[data-open-video]'):
        image=anchor.find('img')
        if image:
            image['src']=relative(config['videosConfig']['videos'][anchor['data-open-video']]['posters'][language],current)
            image['loading']='lazy';image['decoding']='async'
    placeholder = soup.new_tag('header', attrs={'class':'quarto-title-block','hidden':True})
    soup.select_one('main').insert(0,placeholder)
    for link in soup.select(f'[data-locale="{language}"]'):
        link['aria-current'] = 'page'
    source = resolve_tokens(str(soup), language, current, config)
    soup = BeautifulSoup(source, 'html.parser')
    localize_links(soup,config['siteUrl']+current,current,language,config,ENTRIES,route,relative)
    settings=soup.new_tag('script',id='video-config',type='application/json')
    settings.string=json.dumps(locale_video_config(config['videosConfig'], language, lambda asset:relative(asset,current)),ensure_ascii=False).replace('<','\\u003c')
    soup.append(settings)
    for name in ('videos.js','unicornStudio.umd.js','site.js','home.js','asciimark.js','nyx-cta-light.js'):
        tag = soup.new_tag('script', src=relative('assets/'+name, current), defer=True)
        soup.append(tag)
    return str(soup)


def article_navigation(config):
    def item(label, identifier):
        return {'text':label, 'href':route(identifier,'en')}
    return {'left':[
        {'text':'Philosophy','menu':[item('One-Person Company','philosophy'),item('Order, Not Tools','harness')]},
        {'text':'Products','menu':[item('All products','products'),item('NyxID','nyxid-product'),item('Ornn','ornn-product'),item('CMA','cma'),item('GodGPT','godgpt'),item('NyxID technical overview','nyxid'),item('Ornn technical overview','ornn')]},
        {'text':'Research','menu':[item('Research library','research'),item('The AI Agent Connectivity Crisis','nyxid-dossier')]},
        item('Developers','developers'),
        item('About ChronoAI','company')],
        'right':[{'icon':'github','href':config['external']['github']},{'text':'中文','href':'zh/index.html'}]}


def prepare(config, entries):
    if STAGE.exists(): shutil.rmtree(STAGE)
    STAGE.mkdir()
    for name in ('assets','templates'):
        shutil.copytree(ROOT/name, STAGE/name)
    scene_path=STAGE/'assets/us-scene.json'
    scene_path.write_text(scene_path.read_text().replace('assets/us-free-logo.png',config['basePath']+'assets/us-free-logo.png'))
    import base64
    runtime=STAGE/'assets/unicornStudio.umd.js'
    encoded='aHR0cHM6Ly9hc3NldHMudW5pY29ybi5zdHVkaW8vbWVkaWEvbWFkZV9pbl91c19zbWFsbF93ZWIuc3Zn'
    runtime.write_text(runtime.read_text().replace(encoded,base64.b64encode((config['basePath']+'assets/made_in_us_small_web.svg').encode()).decode()))
    shutil.copyfile(ROOT/'styles.css',STAGE/'styles.css')
    shutil.copyfile(ROOT/'assets/article.css',STAGE/'assets/article.css')
    (STAGE/'zh').mkdir()
    quarto = yaml.safe_load((ROOT/'_quarto.yml').read_text())
    quarto['website']['site-url'] = config['siteUrl']
    quarto['project']['render'] = [route(e['id'],lang).replace('.html','.qmd') for e in entries for lang in ('en','zh')]
    quarto['project']['resources'] = ['assets/**','styles.css']
    quarto['website']['navbar'] = article_navigation(config)
    quarto['website']['page-footer'] = {'center':'© 2026 Chrono AI'}
    (STAGE/'_quarto.yml').write_text(yaml.safe_dump(quarto, sort_keys=False))
    mapping = {source: route(entry['id'], lang) for entry in entries for lang,source in entry.items() if lang in ('en','zh')}
    pages = []
    for entry in entries:
        for lang in ('en','zh'):
            current = route(entry['id'],lang)
            if entry['kind'] == 'brand':
                original = BeautifulSoup((ROOT/entry['en']).read_text(),'html.parser')
                meta = {'title':entry['title'][lang], 'description':entry['descriptionZh'] if lang=='zh' else original.select_one('meta[name=description]')['content']}
                meta['brand-class']=' '.join(['brand-page', *original.body.get('class',[])])
                body = '\n```{=html}\n'+brand_body(ROOT,entry,lang,current,config,route,relative)+'\n```\n'
            else:
                meta, body = read_qmd(entry[lang])
            if entry['id'] in ('nyxid','ornn'):
                meta['pagetitle']=meta['title']+(' — 历史技术概览' if lang=='zh' else ' — Archived technical overview')
            meta['lang'] = 'en' if lang == 'en' else 'zh-CN'
            if lang == 'zh': meta['language'] = {'toc-title-document':'目录','toc-title-website':'本页内容','section-title-abstract':'摘要','title-block-author-single':'作者','title-block-published':'发表日期'}
            meta['format'] = {'html': {'include-after-body': {'text': f'<script src="{relative("assets/locale.js",current)}" defer></script>'}}}
            if entry['kind'] in ('home','brand'):
                if entry['kind']=='home':
                    body = '\n```{=html}\n'+home_body(lang,current,config)+'\n```\n'
                styles = ('fonts.css','site.css','refined.css','videos.css') if entry['kind']=='home' else ('fonts.css','site.css','refined.css','brand.css')
                meta['format']['html'].update({'theme':'none','minimal':True,'title-block-style':'none','template':relative('templates/'+('home' if entry['kind']=='home' else 'brand')+'.html',current),'css':[relative('assets/'+n,current) for n in styles]})
                for key in ('template','css'): meta.pop(key,None)
            else:
                # Resolve original language-switch/article links against the explicit publication manifest.
                body = re.sub(r'\]\(([^)\s]+\.qmd)(#[^)]*)?\)', lambda m: ']('+relative(mapping[m[1]],current)+(m[2] or '')+')', body)
                meta['format']['html'].update({'css':[relative('assets/fonts.css',current),relative('styles.css',current),relative('assets/article.css',current)]})
                meta.pop('css',None)
            source = current.replace('.html','.qmd')
            (STAGE/source).parent.mkdir(parents=True,exist_ok=True)
            (STAGE/source).write_text('---\n'+yaml.safe_dump(meta, allow_unicode=True, sort_keys=False)+'---\n'+body)
            pages.append({'id':entry['id'],'kind':entry['kind'],'legacyAlias':entry.get('legacyAlias',False),'source':entry[lang],'path':current,'lang':meta['lang'],'title':meta.get('pagetitle',meta['title']),'description':meta['description'],'url':canonical(config,current),'markdown':f'read/{lang}/{entry["id"]}.md','meta':meta})
    return pages


def add_metadata(soup, page, pair, config, revision, preview):
    # Quarto may emit metadata itself. Own each SEO tag exactly once.
    for tag in soup.select('link[rel=canonical], link[hreflang], meta[property^="og:"], meta[name^="twitter:"], meta[name=description], meta[name=robots], script[type="application/ld+json"]'):
        tag.decompose()
    def append(name, attrs):
        tag = soup.new_tag(name, attrs=attrs); soup.head.append(tag); return tag
    soup.html['lang'] = page['lang']
    append('meta',{'name':'description','content':page['description']})
    append('meta',{'name':'content-revision','content':revision})
    append('link',{'rel':'canonical','href':page['url']})
    for lang in ('en','zh-CN','x-default'):
        append('link',{'rel':'alternate','hreflang':lang,'href':pair['zh' if lang=='zh-CN' else 'en']['url']})
    append('link',{'rel':'alternate','type':'text/markdown','href':config['siteUrl']+page['markdown']})
    append('link',{'rel':'icon','href':relative('assets/favicon.ico',page['path'])})
    for key,value in {'type':'website','site_name':'ChronoAI','title':page['title'],'description':page['description'],'url':page['url'],'locale':'zh_CN' if page['lang']=='zh-CN' else 'en_US','locale:alternate':'en_US' if page['lang']=='zh-CN' else 'zh_CN','image':config['siteUrl']+'assets/social.png','image:alt':'ChronoAI — Build for what comes next.'}.items():
        append('meta',{'property':'og:'+key,'content':value})
    for key,value in {'card':'summary_large_image','title':page['title'],'description':page['description'],'image':config['siteUrl']+'assets/social.png'}.items():
        append('meta',{'name':'twitter:'+key,'content':value})
    if preview: append('meta',{'name':'robots','content':'noindex,nofollow'})
    schema = {'@context':'https://schema.org','@type':'WebPage','name':page['title'],'description':page['description'],'url':page['url'],'inLanguage':page['lang']}
    if page['id'] == 'nyxid-dossier':
        schema.update({'@type':'Article','datePublished':str(page['meta']['date']),'author':{'@type':'Organization','name':page['meta']['author']}})
    tag=append('script',{'type':'application/ld+json'}); tag.string=json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')


def markdown_body(soup, page, config, quarto):
    main = copy.copy(soup.select_one('main'))
    main.name='div';main.attrs={}
    for node in main.select('script, style, canvas, noscript, nav, button, .lang-switch, .article-mobile-toc, [aria-hidden="true"]'): node.decompose()
    seen_diagrams=set()
    for node in list(main.select('svg')):
        if node.get('role')=='img':
            semantic=node.get('aria-label','')+' '+node.get_text(' ',strip=True)
            if semantic in seen_diagrams:
                node.decompose();continue
            seen_diagrams.add(semantic)
            paragraph=BeautifulSoup('<p></p>','html.parser').p
            paragraph.string=semantic
            node.replace_with(paragraph)
        else:
            node.decompose()
    for node in main.select('a[href],img[src]'):
        attr = 'href' if node.name == 'a' else 'src'
        node[attr] = urljoin(page['url'],node[attr])
    # HTML block links need explicit CommonMark structure, rather than illegal nested blocks.
    for card in list(main.select('.bx, .case')):
        destination = card.get('href')
        link_label = None
        for node in list(card.find_all(recursive=False)):
            classes = node.get('class', [])
            if 'bxn' in classes:
                image = node.find('img')
                value = image.get('alt','') if image else node.get_text(' ',strip=True)
                node.clear();node.string=value;node.name='h3'
            elif any(c in classes for c in ('bxk','bxd','soon')) or node.name=='small':
                node.name='p'
            elif 'cbig' in classes: node.name='h3'
            elif 'bxgo' in classes or 'lnk5' in classes:
                link_label=node.get_text(' ',strip=True);node.decompose()
        card.name='section';card.attrs={}
        if destination:
            paragraph=BeautifulSoup('<p><a></a></p>','html.parser').p
            paragraph.a['href']=destination;paragraph.a.string=link_label or destination
            card.append(paragraph)
    for node in list(main.select('h1 img')): node.replace_with(node.get('alt',''))
    for node in list(main.select('span')):
        if not node.find_parent(['pre','code']): node.insert_after(' ')
        node.unwrap()
    for node in list(main.select('div, section, header, aside')): node.unwrap()
    for node in main.find_all(True):
        node.attrs={k:v for k,v in node.attrs.items() if k in ('href','src','alt')}
    result = subprocess.run([quarto,'pandoc','--from=html','--to=commonmark','--wrap=none'],input=main.decode_contents(),capture_output=True,text=True,check=True)
    return result.stdout.strip()+'\n'


def write_derivatives(output, pages, config, revision, quarto, preview):
    for page in pages:
        path = output/page['path']; soup = BeautifulSoup(path.read_text(),'html.parser')
        pair = {('zh' if p['lang']=='zh-CN' else 'en'):p for p in pages if p['id']==page['id']}
        add_metadata(soup,page,pair,config,revision,preview)
        if page['kind']=='brand':
            for stylesheet in soup.select('link[rel=stylesheet]'):
                if stylesheet.get('href','').split('/')[-1]=='styles.css':stylesheet.decompose()
        for placeholder in soup.select('header.quarto-title-block[hidden]'): placeholder.decompose()
        if page['kind']=='article':
            # Keep original QMD bodies intact on disk; navigation belongs outside main.
            for repeated in soup.select('main .lang-switch, main .text-end.text-muted, #title-block-header .description'):
                repeated.decompose()
            locale='zh' if page['lang']=='zh-CN' else 'en'
            other_locale='en' if locale=='zh' else 'zh'
            if page['id'] in ('nyxid','ornn'):
                notice=soup.new_tag('aside',attrs={'role':'note','class':'archive-notice'})
                paragraph=soup.new_tag('p')
                paragraph.append('历史技术概览：保留原始技术说明，其中的产品定位和集成描述可能已变化。当前信息请参阅' if locale=='zh' else 'Archived technical overview: original technical claims are preserved; product positioning and integrations may have changed. See the ')
                link=soup.new_tag('a',href=relative(route(page['id']+'-product',locale),page['path']))
                link.string='当前产品页面' if locale=='zh' else 'current product page'
                paragraph.append(link);paragraph.append('。' if locale=='zh' else '.')
                notice.append(paragraph);soup.select_one('#title-block-header').insert_after(notice)
            toc=soup.select_one('#TOC > ul')
            if toc:
                details=soup.new_tag('details',attrs={'class':'article-mobile-toc'})
                summary=soup.new_tag('summary');summary.string='本页目录' if locale=='zh' else 'On this page';details.append(summary)
                links=copy.copy(toc)
                for node in [links,*links.find_all(True)]:
                    node.attrs={k:v for k,v in node.attrs.items() if k=='href'}
                details.append(links)
                (soup.select_one('.archive-notice') or soup.select_one('#title-block-header')).insert_after(details)
            language_link=soup.select_one('#quarto-header a[href$="zh/index.html"]')
            if not language_link:
                raise ValueError('Missing native Quarto language navigation: '+page['path'])
            language_link['href']=relative(route(page['id'],other_locale),page['path'])
            language_link['data-locale']=other_locale
            language_link['hreflang']='en' if other_locale=='en' else 'zh-CN'
            language_link.select_one('.menu-text').string='EN' if other_locale=='en' else '中文'
            tools=soup.select_one('#quarto-header .quarto-navbar-tools')
            if not tools:
                raise ValueError('Missing native Quarto navigation tools')
            parent=language_link.parent
            tools.append(language_link.extract())
            if not parent.get_text(strip=True):parent.decompose()
            for link in soup.select('#quarto-header a[href]'):
                if link.has_attr('data-locale') or not link['href'] or link['href'].startswith('#'):continue
                for identifier,english_path in ROUTES.items():
                    if urlparse(urljoin(page['url'],link['href'])).path==config['basePath']+english_path:
                        link['href']=relative(route(identifier,locale),page['path'])
                        break
            if locale=='zh':
                translate(soup.select_one('#quarto-header'),{'ChronoAI':'ChronoAI','Philosophy':'组织理念','One-Person Company':'一人公司','Order, Not Tools':'秩序，不是工具','Products':'产品','All products':'所有产品','NyxID technical overview':'NyxID 技术概览','Ornn technical overview':'Ornn 技术概览','Research':'研究','Research library':'研究知识库','Developers':'开发者资源','The AI Agent Connectivity Crisis':'AI Agent 连接危机','About ChronoAI':'关于 ChronoAI'})
        if page['id'] != 'home':
            other = next(p for p in pages if p['id']==page['id'] and p['lang']!=page['lang'])
            other_soup = BeautifulSoup((output/other['path']).read_text(),'html.parser')
            selector='main [data-locale-section]' if page['kind']=='brand' else 'main section[id]'
            headings = soup.select(selector)
            other_headings = other_soup.select(selector)
            if len(headings) != len(other_headings): raise ValueError('Paired article section counts differ: '+page['id'])
            for link in soup.select('.lang-switch a'):
                link['data-locale']='en' if page['lang']=='zh-CN' else 'zh'
                link['hreflang']=other['lang']
            anchors = {current['id']:target['id'] for current,target in zip(headings,other_headings)}
            mapping=soup.new_tag('script',type='application/json',id='locale-anchors')
            mapping.string=json.dumps(anchors,ensure_ascii=False).replace('<','\\u003c')
            soup.body.append(mapping)
        # Language navigation is an enhancement; native links still work without JS.
        localize_links(soup,page['url'],page['path'],'zh' if page['lang']=='zh-CN' else 'en',config,ENTRIES,route,relative)
        script=soup.new_tag('script',src=relative('assets/locale.js',page['path']),defer=True)
        if not soup.select_one('script[src$="locale.js"]'):soup.body.append(script)
        path.write_text(('<!doctype html>\n' if not str(soup).lower().startswith('<!doctype') else '')+str(soup))
        mirror=output/page['markdown'];mirror.parent.mkdir(parents=True,exist_ok=True)
        mirror.write_text('---\n'+yaml.safe_dump({'title':page['title'],'lang':page['lang'],'canonical':page['url'],'content-revision':revision},allow_unicode=True,sort_keys=False)+'---\n\n'+markdown_body(soup,page,config,quarto))
    aliases = {}
    for p in pages:
        if p['lang'] != 'zh-CN' or not p['legacyAlias']: continue
        alias = ('index' if p['id']=='home' else p['id'])+'-zh.html'; target=p['path']; aliases[alias]=target
        # Static compatibility: refresh to a real HTML page, while JS preserves query and hash.
        rel=relative(target,alias)
        (output/alias).write_text(f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>页面已迁移 · Page moved</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="{p["url"]}"><meta http-equiv="refresh" content="0;url={rel}"></head><body><a href="{rel}">继续阅读中文页面 · Continue</a><script>location.replace({json.dumps(rel)}+location.search+location.hash)</script></body></html>')
    ns='http://www.sitemaps.org/schemas/sitemap/0.9'
    sitemap=Element('urlset',xmlns=ns)
    for p in pages: SubElement(SubElement(sitemap,'url'),'loc').text=p['url']
    ElementTree(sitemap).write(output/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    llms=['# ChronoAI','',pages[0]['description'],'',f'Content revision: {revision}','','HTML pages are canonical. Markdown mirrors contain the same substantive content. Project capabilities and availability vary.','']
    for lang in ('en','zh-CN'):
        llms+=['## '+('English' if lang=='en' else '中文'),'']
        for p in pages:
            if p['lang']==lang:llms.append(f'- [{p["title"]}]({config["siteUrl"]+p["markdown"]}): {p["description"]} Canonical: {p["url"]}')
        llms.append('')
    llms+=['## Videos / 视频','']
    for language in ('en','zh'):
        for key,video in config['videosConfig']['videos'].items():
            llms.append(f'- [{video["sourceTitle"]}]({watch_url(config["videosConfig"],key,language)}) — {language}: {video["duration"]}, English video. Context: {canonical(config,route("home",language))}#{"video-case" if key=="case" else "research-video"}')
    (output/'llms.txt').write_text('\n'.join(llms))
    # Crawlability and training permissions are separate; this file grants no training license.
    robots='User-agent: *\n'+('Disallow: /\n' if preview else f'Allow: {config["basePath"]}\nSitemap: {config["siteUrl"]}sitemap.xml\n')
    (output/'robots.txt').write_text(robots)
    (output/'_headers').write_text(config['basePath']+'read/*\n  X-Robots-Tag: noindex\n  Content-Type: text/markdown; charset=utf-8\n'+config['basePath']+'llms.txt\n  Content-Type: text/plain; charset=utf-8\n')
    (output/'404.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>404 — ChronoAI</title><meta name="robots" content="noindex"></head><body><h1>404</h1><p>Page not found / 页面不存在</p><a href="'+config['basePath']+'">ChronoAI</a></body></html>')
    manifest={'revision':revision,'siteUrl':config['siteUrl'],'basePath':config['basePath'],'preview':preview,'videos':config['videosConfig'],'quartoVersion':subprocess.check_output([quarto,'--version'],text=True).strip(),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'pages':[{k:v for k,v in p.items() if k!='meta'} for p in pages],'aliases':aliases}
    manifest['files']={p.relative_to(output).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(output.rglob('*')) if p.is_file()}
    (output/'publication.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');args=parser.parse_args()
    config=load_configuration(); entries=json.loads((ROOT/'content/publication.json').read_text())
    quarto=os.environ.get('QUARTO_BIN') or shutil.which('quarto') or str(ROOT/'.tools/bin/quarto')
    if not Path(quarto).is_file():raise RuntimeError('Install Quarto or set QUARTO_BIN; see docs/implementation.md')
    output=ROOT/('_preview' if args.preview else '_site')
    revision=source_revision();pages=prepare(config,entries)
    if output.exists():shutil.rmtree(output)
    subprocess.run([quarto,'render','--output-dir',str(output)],cwd=STAGE,check=True)
    write_derivatives(output,pages,config,revision,quarto,args.preview)
    print(f'Built {len(pages)} canonical pages at {output}; revision {revision}')


if __name__=='__main__':
    try: main()
    except Exception:
        print(f'[chrono-build trace={uuid.uuid4()}] Build failed; no publication was deployed.',file=sys.stderr)
        raise
