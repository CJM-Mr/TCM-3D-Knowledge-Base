# -*- coding: utf-8 -*-
"""
一键构建：
  1) 构建前端（Vite）到 web/
  2) PyInstaller 打包单文件 exe（内含 Flask 服务 + SQLite + 前端 + 原始文档）
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = '三维知识网络'
ICON = os.path.join(ROOT, 'assets', 'app.ico')
# 数据库随 exe 一起打包（正本在项目 data/ 下）
DB_FILE = os.environ.get('TCM_DB') or os.path.join(ROOT, 'data', 'tcm.db')


def sh(cmd, cwd, shell=False):
    print('\n$ ' + (' '.join(cmd) if isinstance(cmd, list) else cmd))
    r = subprocess.run(cmd, cwd=cwd, shell=shell)
    if r.returncode != 0:
        sys.exit('命令失败：%s' % cmd)


def main():
    fe = os.path.join(ROOT, 'frontend')
    if not os.path.isdir(os.path.join(fe, 'node_modules')):
        sh(['npm', 'install', '--no-audit', '--no-fund'], fe, shell=True)
    sh(['npm', 'run', 'build'], fe, shell=True)

    web = os.path.join(ROOT, 'web')
    if not os.path.isfile(os.path.join(web, 'index.html')):
        sys.exit('前端构建产物缺失：' + web)

    if not os.path.isfile(DB_FILE):
        sys.exit('数据库缺失：%s\n请先执行 python scripts/build_db.py' % DB_FILE)

    if not os.path.isfile(ICON):
        print('图标缺失，正在生成…')
        sh([sys.executable, os.path.join(ROOT, 'scripts', 'make_icon.py')], ROOT)

    sep = ';' if os.name == 'nt' else ':'
    args = [
        sys.executable, '-m', 'PyInstaller',
        '--noconfirm', '--clean', '--onefile',
        '--noconsole',
        '--name', NAME,
        '--icon', ICON,
        '--distpath', os.path.join(ROOT, 'dist'),
        '--workpath', os.path.join(ROOT, 'build'),
        '--specpath', os.path.join(ROOT, 'build'),
        '--add-data', DB_FILE + sep + 'data',
        '--add-data', os.path.join(ROOT, 'web') + sep + 'web',
        '--add-data', os.path.join(ROOT, 'docs') + sep + 'docs',
        '--collect-submodules', 'waitress',
        '--exclude-module', 'tkinter',
        '--exclude-module', 'matplotlib',
        '--exclude-module', 'PIL',
        os.path.join(ROOT, 'backend', 'app.py'),
    ]
    sh(args, ROOT)

    exe = os.path.join(ROOT, 'dist', NAME + ('.exe' if os.name == 'nt' else ''))
    if not os.path.isfile(exe):
        sys.exit('未找到打包产物：' + exe)

    target = os.path.join(ROOT, NAME + ('.exe' if os.name == 'nt' else ''))
    shutil.copy2(exe, target)
    print('\n完成：%s（%.1f MB）' % (target, os.path.getsize(target) / 1024 / 1024))


if __name__ == '__main__':
    main()
