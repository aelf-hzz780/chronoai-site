"""HTTP contract check against the loopback server, including the mounted base path."""
import json,sys,hashlib,os
from pathlib import Path
from urllib.request import urlopen, build_opener, HTTPRedirectHandler, Request
from urllib.error import HTTPError
from urllib.parse import urlsplit
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8768/chronoai-site/'
raw_manifest=urlopen(base+'publication.json').read()
manifest=json.loads(raw_manifest)
checks=[]
def request(path,status=200,mime=None,noindex=None):
    try: response=urlopen(base+path)
    except HTTPError as error: response=error
    assert response.status==status,(path,response.status,status)
    if mime: assert response.headers.get_content_type()==mime,(path,response.headers)
    if noindex is not None: assert ('noindex' in response.headers.get('X-Robots-Tag',''))==noindex
    checks.append({'path':path,'status':response.status,'mime':response.headers.get_content_type(),'robots':response.headers.get('X-Robots-Tag')})
    return response.read().decode('utf-8')
for page in manifest['pages']:
    body=request(page['path'],mime='text/html',noindex=manifest['preview'])
    assert manifest['revision'] in body
    md=request(page['markdown'],mime='text/markdown',noindex=True)
    assert manifest['revision'] in md and page['url'] in md
for alias,target in manifest['aliases'].items():
    body=request(alias,mime='text/html',noindex=manifest['preview']);assert target in body
request('llms.txt',mime='text/plain',noindex=manifest['preview'])
request('robots.txt',mime='text/plain',noindex=manifest['preview'])
request('sitemap.xml',mime='application/xml',noindex=manifest['preview'])
for path in ['unknown','zh/unknown.html','hidden-draft.html','read/en/unknown.md','scripts/build.py','docs/implementation.md']:
    request(path,status=404)
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):return None
opener=build_opener(NoRedirect)
directory_urls=([base.rstrip('/')] if manifest['basePath']!='/' else [])+[base+'zh']
for url in directory_urls:
    for method in ['GET','HEAD']:
        try: response=opener.open(Request(url+'?sample=1',method=method))
        except HTTPError as error:response=error
        assert response.status==301
        assert response.headers['Location']==urlsplit(url).path+'/?sample=1'
        assert urlopen(url+'?sample=1').status==200
        checks.append({'path':url,'method':method,'status':301,'location':response.headers['Location']})
for path in (['/','/unknown.html'] if manifest['basePath']!='/' else ['/unknown.html']):
    try: response=urlopen(urlsplit(base)._replace(path='',query='',fragment='').geturl()+path)
    except HTTPError as error:response=error
    assert response.status==404
(Path(os.environ.get('HTTP_EVIDENCE_DIR','docs/evidence'))/('http-preview.json' if manifest['preview'] else 'http-public.json')).write_text(json.dumps({'status':'pass','contentRevision':manifest['revision'],'bundleManifestSHA256':hashlib.sha256(raw_manifest).hexdigest(),'preview':manifest['preview'],'base':base,'checks':checks},indent=2)+'\n')
print(f'PASS: {len(checks)+2} HTTP contracts; real 404s, MIME, mounted URLs and indexing headers')
