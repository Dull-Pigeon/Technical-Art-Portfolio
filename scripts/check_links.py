from html.parser import HTMLParser
import os
from pathlib import Path
from urllib.parse import urlsplit, unquote

base = os.environ.get('SITE_BASE_PATH', '').rstrip('/')
root = Path(__file__).resolve().parents[1] / 'dist'
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.links = path, set(), []
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            assert a['id'] not in self.ids, f'Duplicate ID {self.path}: {a["id"]}'
            self.ids.add(a['id'])
        for key in ('href', 'src', 'poster'):
            if a.get(key): self.links.append(a[key])

pages = {p: Page(p) for p in root.rglob('*.html')}
for p, page in pages.items():
    text = p.read_text()
    assert 'lang="en"' in text and 'name="viewport"' in text and '<title>' in text
    for link in page.links:
        u = urlsplit(link)
        if base and u.path.startswith(base + '/'):
            u = u._replace(path=u.path[len(base):])
        if u.scheme or u.netloc: continue
        target = root / unquote(u.path.lstrip('/')) if u.path.startswith('/') else p.parent / unquote(u.path)
        if not u.path: target = p
        if target.is_dir(): target /= 'index.html'
        assert target.is_file(), f'Missing target {p}: {link}'
        if u.fragment and target in pages:
            assert u.fragment in pages[target].ids, f'Missing fragment {p}: {link}'
print(f'PASS: {len(pages)} pages; all internal files, fragments, IDs and metadata checked.')
