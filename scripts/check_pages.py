"""Validate the Pages build in isolation while dist is serving the local preview."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory


def main():
    project = Path(__file__).resolve().parents[1]
    env = {**os.environ, 'SITE_BASE_PATH': '/Technical-Art-Portfolio', 'PYTHONUTF8': '1'}
    with TemporaryDirectory(prefix='portfolio-pages-') as directory:
        build = Path(directory)
        for folder in ('content', 'dist', 'scripts'):
            shutil.copytree(project / folder, build / folder)
        subprocess.run(['node', 'scripts/render.mjs'], cwd=build, env=env, check=True)
        subprocess.run([sys.executable, 'scripts/check_links.py'], cwd=build, env=env, check=True)


if __name__ == '__main__':
    main()
