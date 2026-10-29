#!/usr/bin/env python3
"""Loopback-only static preview with truthful MIME, indexing headers and real 404s."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import unquote,urlsplit
import uuid


class PreviewHandler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.md':'text/markdown; charset=utf-8','.txt':'text/plain; charset=utf-8','.js':'text/javascript; charset=utf-8'}

    def do_GET(self):
        self.serve_static(head=False)

    def do_HEAD(self):
        self.serve_static(head=True)

    def serve_static(self, head):
        path=unquote(urlsplit(self.path).path)
        if self.server.base_path != '/' and path == self.server.base_path.rstrip('/'):
            self.send_response(301)
            self.send_header('Location',path+'/' + ('?' + urlsplit(self.path).query if urlsplit(self.path).query else ''))
            self.send_header('Content-Length','0');self.end_headers();return
        if not path.startswith(self.server.base_path):
            self.send_error(404);return
        local=path[len(self.server.base_path):]
        target=(Path(self.directory)/local).resolve()
        root=Path(self.directory).resolve()
        if not target.is_relative_to(root) or not (target.is_file() or (target/'index.html').is_file()):
            self.send_error(404);return
        if target.is_dir() and not path.endswith('/'):
            self.send_response(301)
            self.send_header('Location',path+'/' + ('?' + urlsplit(self.path).query if urlsplit(self.path).query else ''))
            self.send_header('Content-Length','0');self.end_headers();return
        self.path='/'+local+('?' + urlsplit(self.path).query if urlsplit(self.path).query else '')
        if self.server.preview:
            # A preview rebuild must never validate a previously cached asset.
            for header in ('If-Modified-Since','If-None-Match'):
                if header in self.headers:del self.headers[header]
        if head: super().do_HEAD()
        else: super().do_GET()

    def end_headers(self):
        if self.server.preview:
            self.send_header('Cache-Control','no-store')
        if self.server.preview or urlsplit(self.path).path.startswith('/read/'):
            self.send_header('X-Robots-Tag','noindex, nofollow' if self.server.preview else 'noindex')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('X-Trace-ID',str(uuid.uuid4()))
        super().end_headers()


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--directory',default='_preview');p.add_argument('--port',type=int,default=8768);args=p.parse_args()
    root=Path(args.directory).resolve(); manifest=json.loads((root/'publication.json').read_text())
    if not 1024<=args.port<=65535:raise ValueError('Choose an unprivileged port')
    server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(PreviewHandler,directory=str(root)))
    server.base_path=manifest['basePath'];server.preview=manifest['preview']
    print(f'Preview: http://127.0.0.1:{args.port}{server.base_path}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:server.server_close()
