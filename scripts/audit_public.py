"""Heuristic pre-publication check. Review binary content and ownership separately."""
from pathlib import Path
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    'encoded video': r'data\x3avideo/|[A-Za-z0-9+/]{1000,}={0,2}',
    'private key': r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'GitHub credential': r'\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b',
    'cloud access key': r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
    'service credential': r'\b(?:sk-[A-Za-z0-9_-]{24,}|xox[baprs]-[A-Za-z0-9-]{20,})\b',
    'credential in URL': r'https?://[^\s/:]+:[^\s/@]+@',
    'local absolute path': r'(?:\x2fhome\x2f|\x2fUsers\x2f|\x2fworkspace\x2f|\x2froot\x2f|[A-Za-z]:\\(?:Users|Documents)\\)[^\s<>"\']+',
}
FORBIDDEN_PARTS = {'node_modules', '__pycache__', '.venv', '.sites-runtime', 'Library', 'Temp', 'Logs', 'Obj', 'Packages', 'ProjectSettings'}
FORBIDDEN_SUFFIXES = {'.pem', '.key', '.p12', '.pfx', '.unity', '.prefab', '.fbx', '.blend', '.psd', '.unitypackage', '.cs', '.mp4', '.mov', '.webm', '.avi', '.mkv', '.b64', '.base64'}
TEXT_SUFFIXES = {'.md', '.json', '.html', '.css', '.mjs', '.js', '.py', '.yml', '.yaml', '.txt'}

def scan(label, text):
    for name, pattern in PATTERNS.items():
        if re.search(pattern, text):
            failures.append(f'{label}: possible {name}')

failures = []
try:
    names = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
except subprocess.CalledProcessError:
    sys.exit('Run in an initialized repository after staging files.')
for name in filter(None, names):
    p = ROOT / name
    if p.is_symlink():
        failures.append(f'{name}: symbolic link requires review')
        continue
    if any(part in FORBIDDEN_PARTS for part in p.relative_to(ROOT).parts) or p.suffix.lower() in FORBIDDEN_SUFFIXES or p.name.startswith('.env'):
        failures.append(f'{name}: excluded file type or directory')
    if not p.is_file():
        failures.append(f'{name}: tracked file is missing')
        continue
    if p.stat().st_size > 20_000_000:
        failures.append(f'{name}: file exceeds 20 MB; review web export')
    if p.suffix in TEXT_SUFFIXES or p.name == '.gitignore':
        scan(name, p.read_text())
    elif p.suffix == '.docx':
        with zipfile.ZipFile(p) as archive:
            for entry in archive.namelist():
                if entry.endswith(('.xml', '.rels')):
                    scan(f'{name}:{entry}', archive.read(entry).decode('utf-8'))
if failures:
    print('\n'.join(failures))
    sys.exit(1)
print('PASS: tracked file names, common credential patterns, local paths and DOCX XML. Manual review remains required.')
