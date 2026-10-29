"""Adapt frozen official pages without replacing their substantive content or layout."""
import json
from urllib.parse import urljoin, urlparse, urlunsplit
from bs4 import BeautifulSoup, Comment


def translate(soup, translations):
    for node in soup.find_all(string=True):
        if isinstance(node, Comment) or node.parent.name in ('style', 'script'):
            continue
        key = str(node).strip()
        if key in translations:
            node.replace_with(str(node).replace(key, translations[key]))
    for node in soup.select('[aria-label], [alt]'):
        for attr in ('aria-label', 'alt'):
            if node.get(attr) in translations:
                node[attr] = translations[node[attr]]


def localize_links(soup, source_url, current, language, config, entries, route, relative):
    """Resolve only declared official-site pages; preserve query order and fragments."""
    local={'/':'home'}
    for entry in entries:
        path=entry.get('path','index.html' if entry['id']=='home' else entry['id']+'.html')
        local['/'+path]=entry['id']
        local['/zh/'+path]=entry['id']
    host=urlparse(config['onlineOrigin']).netloc
    for anchor in soup.select('a[href]'):
        if anchor.has_attr('data-locale') or anchor.find_parent(['pre','code']) or anchor['href'].startswith('#'):
            continue
        parsed=urlparse(urljoin(source_url,anchor['href']))
        if parsed.netloc!=host or parsed.path not in local:
            continue
        target=relative(route(local[parsed.path],language),current)
        anchor['href']=urlunsplit(('','',target,parsed.query,parsed.fragment))
        anchor.attrs.pop('target',None);anchor.attrs.pop('rel',None)


def brand_body(root, entry, language, current, config, route, relative):
    original = BeautifulSoup((root / entry['en']).read_text(), 'html.parser')
    soup = BeautifulSoup(str(original.body), 'html.parser')
    for node in soup.select('script'):
        node.decompose()
    source_url = config['onlineOrigin'] + '/' + entry['path']
    for node in soup.select('[href], [src]'):
        for attr in ('href', 'src'):
            if not node.has_attr(attr) or node[attr].startswith('#'):
                continue
            absolute = urljoin(source_url, node[attr])
            parsed = urlparse(absolute)
            if parsed.netloc != urlparse(config['onlineOrigin']).netloc:
                continue
            if parsed.path.startswith('/cdn-cgi/l/email-protection'):
                encoded = parsed.fragment or (node.select_one('[data-cfemail]') or {}).get('data-cfemail')
                if not encoded:
                    raise ValueError('Missing frozen contact address')
                raw = bytes.fromhex(encoded)
                address = bytes(value ^ raw[0] for value in raw[1:]).decode()
                node[attr] = 'mailto:' + address
                for text in node.select('[data-cfemail]'):
                    text.replace_with(address)
            elif parsed.path.startswith('/assets/'):
                node[attr] = relative(parsed.path.lstrip('/'), current)
            else:
                # Pages outside the approved local publication remain online links.
                node[attr] = absolute
    localize_links(soup,source_url,current,language,config,json.loads((root/'content/publication.json').read_text()),route,relative)
    if language == 'zh':
        translations = json.loads((root / 'content/home.zh.json').read_text())
        for dictionary in sorted((root/'content/brand').glob('*.zh.json')):
            translations.update(json.loads(dictionary.read_text()))
        translations.update(json.loads((root / entry['zh']).read_text()))
        translate(soup, translations)
    for index, section in enumerate(soup.select('main section, main .sec, main .card, main .qcard'), 1):
        if not section.get('id'):
            section['id'] = 'section-' + str(index)
        section['data-locale-section'] = ''
    controls = BeautifulSoup('<div class="language-switch" role="group"><a data-locale="en" hreflang="en">EN</a><a data-locale="zh" hreflang="zh-CN">中文</a></div>', 'html.parser').div
    controls['aria-label'] = '语言' if language == 'zh' else 'Language'
    for link in controls.select('a'):
        locale = link['data-locale']
        link['href'] = relative(route(entry['id'], locale), current)
        if locale == language:
            link['aria-current'] = 'page'
    soup.select_one('header .try').insert_before(controls)
    import copy
    soup.select_one('footer .fl').append(copy.copy(controls))
    # Quarto's title is replaced by the original page's existing H1.
    placeholder = soup.new_tag('header', attrs={'class': 'quarto-title-block', 'hidden': True})
    soup.select_one('main').insert(0, placeholder)
    scripts=['site.js','brand-motion.js']
    if entry['id']=='research':scripts.append('research.js')
    for name in scripts:
        soup.body.append(soup.new_tag('script', src=relative('assets/' + name, current), defer=True))
    return soup.body.decode_contents()
