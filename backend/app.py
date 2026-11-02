# -*- coding: utf-8 -*-
"""
本草维度 · 中药与方剂三维知识网络
Flask 后端：提供 REST API + 托管前端构建产物
"""
import json
import os
import socket
import sys
import tempfile
import threading
import time
import webbrowser

from flask import Flask, abort, jsonify, request, send_from_directory

import db as dbmod
import graph as graphmod
import inddetail as indmod
import search as searchmod

APP_NAME = '三维知识网络'
DEFAULT_PORT = 8765

# PyInstaller --noconsole 打包后 stdout/stderr/stdin 可能为 None，
# 直接 print/input 会抛异常，这里统一兜底到 devnull。
if sys.stdout is None:
    sys.stdout = open(os.devnull, 'w', encoding='utf-8')
if sys.stderr is None:
    sys.stderr = open(os.devnull, 'w', encoding='utf-8')
if sys.stdin is None:
    sys.stdin = open(os.devnull, 'r', encoding='utf-8')

# 数据库默认随程序放在 data/ 下，可用 --db 或环境变量 TCM_DB 覆盖


# ---------------------------------------------------------------- 路径解析
def base_dir():
    """打包后资源目录（PyInstaller onefile 解压到 _MEIPASS）"""
    if getattr(sys, 'frozen', False):
        return getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def web_dir():
    return os.path.join(base_dir(), 'web')


def db_candidates():
    """数据库查找顺序：命令行/环境变量 → 程序自带 data/tcm.db → 上级项目 data/tcm.db"""
    out = []
    env = os.environ.get('TCM_DB')
    if env:
        out.append(env)
    out.append(os.path.join(base_dir(), 'data', 'tcm.db'))
    out.append(os.path.join(os.path.dirname(base_dir()), 'data', 'tcm.db'))
    return out


def db_path():
    for p in db_candidates():
        if p and os.path.isfile(p):
            return p
    return db_candidates()[0]


# ---------------------------------------------------------------- 应用工厂
def create_app():
    app = Flask(__name__, static_folder=None)
    app.config['JSON_AS_ASCII'] = False
    app.json.ensure_ascii = False

    store = dbmod.DB(db_path())
    if getattr(sys, 'frozen', False):
        store.use_memory()          # 打包版：整体读入内存，只读、零锁
    app.config['STORE'] = store

    def D():
        return app.config['STORE']

    def J(obj, code=200):
        return app.response_class(
            json.dumps(obj, ensure_ascii=False),
            status=code, mimetype='application/json; charset=utf-8')

    # ------------------------------------------------ 元数据 / 索引
    @app.get('/api/health')
    def health():
        return J({'ok': True, 'counts': D().counts})

    @app.get('/api/meta')
    def meta():
        s = D()
        sh = s.book_meta('shanghan')
        fx = s.book_meta('fangjixue')
        return J({
            'counts': s.counts,
            'categories': s.categories,
            'fcats': s.formula_categories,
            'effects': s.effects,
            'meridians': s.meridians,
            'shanghan': {
                'id': 'shanghan', 'full': sh.get('full', '《伤寒论》'),
                'author': sh.get('author', ''), 'dynasty': sh.get('dynasty', ''),
                'year': sh.get('year', ''), 'volume': sh.get('volume', ''),
                'liujing': [x['key'] for x in sh.get('liujing', [])],
                'liujingDetail': sh.get('liujing', [])
            },
            'fangjixue': {
                'id': 'fangjixue', 'full': fx.get('full', '《方剂学》'),
                'author': fx.get('author', ''), 'edition': fx.get('edition', ''),
                'chapters': [c['name'] for c in fx.get('chapters', [])]
            }
        })

    @app.get('/api/index')
    def index():
        """启动时一次性拉取的轻量索引：中药 + 方剂概要（含组成药味 id/角色）"""
        s = D()
        nf = s.herb_formula_counts()
        herbs = [{'id': h['id'], 'name': h['name'], 'cat': h['cat'], 'sub': h['sub'],
                  'nat': h['nat'], 'fla': h['fla'], 'mer': h['mer'], 'eff': h['eff'],
                  'tags': h['tags'], 'nf': nf.get(h['id'], 0)}
                 for h in s.herbs_where('1=1')]
        formulas = s.formula_summaries()
        return J({'herbs': herbs, 'formulas': formulas})

    # ------------------------------------------------ 中药
    @app.get('/api/herbs/<hid>')
    def herb_detail(hid):
        s = D()
        h = s.herb(hid)
        if not h:
            abort(404)
        return J({'herb': h, 'formulas': s.herb_formulas(hid),
                  'indExplain': indmod.herb(h)})

    # ------------------------------------------------ 方剂
    @app.get('/api/formulas/<fid>')
    def formula_detail(fid):
        s = D()
        f = s.formula(fid)
        if not f:
            abort(404)
        f['indExplain'] = indmod.formula(f)
        return J(f)

    @app.get('/api/formulas/<fid>/related')
    def formula_related(fid):
        s = D()
        f = s.formula(fid)
        if not f:
            abort(404)
        mine = set(c['h'] for c in f['comp'])
        rels = [s.formula_summaries_map()[i] for i in (f.get('rel') or [])
                if i in s.formula_summaries_map()]
        shared = []
        for other in s.formulas_where('id <> ?', (fid,)):
            theirs = set(c['h'] for c in other['comp'])
            common = mine & theirs
            if len(common) < 2:
                continue
            shared.append({
                'id': other['id'], 'name': other['name'], 'n': len(common),
                'ratio': len(common) / max(1, len(other['comp'])),
                'common': [s.name_of(x) for x in common],
                'onlyA': [s.name_of(x) for x in (mine - theirs)],
                'onlyB': [s.name_of(x) for x in (theirs - mine)]
            })
        shared.sort(key=lambda x: (-x['ratio'], -x['n']))
        return J({'rels': [{'id': r['id'], 'name': r['name']} for r in rels],
                  'shared': shared[:10]})

    @app.get('/api/compare')
    def compare():
        ids = [x for x in (request.args.get('ids') or '').split(',') if x]
        return J({'formulas': D().formulas_by_ids(ids[:4])})

    # ------------------------------------------------ 三维场景
    @app.get('/api/graph')
    def graph():
        s = D()
        mode = request.args.get('mode', 'overview')
        ids = [x for x in (request.args.get('ids') or '').split(',') if x]
        try:
            sc = graphmod.build(s, mode, id=request.args.get('id', ''),
                                key=request.args.get('key', ''), ids=ids,
                                deep=request.args.get('deep') in ('1', 'true'))
        except Exception as e:                       # noqa: BLE001
            return J({'mode': 'sphere', 'nodes': [], 'links': [],
                      'title': '', 'error': str(e)}, 500)
        return J(sc)

    # ------------------------------------------------ 检索
    @app.get('/api/search')
    def search():
        return J({'groups': searchmod.run(D(), request.args.get('q', ''))})

    # ------------------------------------------------ 典籍 / 教材
    @app.get('/api/book/shanghan')
    def book_shanghan():
        s = D()
        meta = s.book_meta('shanghan')
        lj_meta = {x['key']: x for x in meta.get('liujing', [])}
        # 六经之外还有「差后劳复」等篇目，一并纳入，保证 79 首全部可达
        keys = list(lj_meta.keys())
        for row in s.conn().execute("SELECT DISTINCT lj FROM formula WHERE book='shanghan' AND lj<>''"):
            if row['lj'] not in keys:
                keys.append(row['lj'])

        blocks = []
        for key in keys:
            rows = s.formulas_where("book='shanghan' AND lj=?", (key,), with_comp=False)
            if not rows:
                continue
            info = lj_meta.get(key, {})
            blocks.append({
                'key': key,
                'outline': info.get('outline', ''),
                'note': info.get('note', ''),
                'formulas': [{'id': r['id'], 'name': r['name']} for r in rows]
            })
        all_rows = s.formulas_where("book='shanghan'", with_comp=False)
        return J({'meta': meta, 'blocks': blocks,
                  'formulas': [{'id': r['id'], 'name': r['name']} for r in all_rows],
                  'herbCount': len({c['h'] for r in all_rows for c in s.comp(r['id'])})})

    @app.get('/api/book/shanghan/<lj>')
    def book_shanghan_lj(lj):
        s = D()
        meta = s.book_meta('shanghan')
        row = next((x for x in meta.get('liujing', []) if x['key'] == lj), None)
        if not row:
            abort(404)
        rows = s.formulas_where("book='shanghan' AND lj=?", (lj,))
        return J({'key': lj, 'outline': row.get('outline', ''), 'note': row.get('note', ''),
                  'formulas': rows})

    @app.get('/api/book/fangjixue')
    def book_fjx():
        s = D()
        meta = s.book_meta('fangjixue')
        chapters = []
        for c in meta.get('chapters', []):
            rows = s.formulas_where('fjx=1 AND fjx_cat=?', (c['name'],), with_comp=False)
            chapters.append({
                'name': c['name'], 'sections': c.get('sections', []),
                'count': len(rows),
                'formulas': [{'id': r['id'], 'name': r['name']} for r in rows]
            })
        return J({'meta': meta, 'chapters': chapters})

    @app.get('/api/book/fangjixue/<chapter>')
    def book_fjx_chapter(chapter):
        s = D()
        meta = s.book_meta('fangjixue')
        ch = next((c for c in meta.get('chapters', []) if c['name'] == chapter), None)
        if not ch:
            abort(404)
        rows = s.formulas_where('fjx=1 AND fjx_cat=?', (chapter,), with_comp=False)
        return J({'name': chapter, 'sections': ch.get('sections', []),
                  'formulas': rows})

    # ------------------------------------------------ 原始文档
    @app.get('/api/docs')
    def docs():
        d = os.path.join(base_dir(), 'docs')
        out = []
        if os.path.isdir(d):
            for name in sorted(os.listdir(d)):
                p = os.path.join(d, name)
                if os.path.isfile(p):
                    out.append({'name': name, 'size': os.path.getsize(p)})
        return J({'docs': out})

    @app.get('/docs/<path:name>')
    def docs_download(name):
        return send_from_directory(os.path.join(base_dir(), 'docs'), name, as_attachment=True)

    # ------------------------------------------------ 页面心跳 / 关闭通知
    @app.route('/api/ping', methods=['GET', 'POST'])
    def ping():
        global _HAD_CLIENT
        cid = request.args.get('cid') or 'default'
        with _LIFECYCLE_LOCK:
            _CLIENTS[cid] = time.time()
            _HAD_CLIENT = True
        return ('', 204)

    @app.route('/api/bye', methods=['GET', 'POST'])
    def bye():
        cid = request.args.get('cid') or 'default'
        with _LIFECYCLE_LOCK:
            _CLIENTS.pop(cid, None)
        return ('', 204)

    # ------------------------------------------------ 前端静态资源
    @app.get('/')
    @app.get('/<path:path>')
    def spa(path=''):
        root = web_dir()
        if path and os.path.isfile(os.path.join(root, path)):
            return send_from_directory(root, path)
        idx = os.path.join(root, 'index.html')
        if not os.path.isfile(idx):
            return ('<h3>前端尚未构建</h3><p>请先执行 <code>cd frontend &amp;&amp; npm run build</code></p>',
                    503, {'Content-Type': 'text/html; charset=utf-8'})
        return send_from_directory(root, 'index.html')

    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return J({'error': 'not found', 'path': request.path}, 404)
        root = web_dir()
        if os.path.isfile(os.path.join(root, 'index.html')):
            return send_from_directory(root, 'index.html')
        return ('Not Found', 404)

    return app


# ---------------------------------------------------------------- 实例与生命周期
_LIFECYCLE_LOCK = threading.Lock()
_CLIENTS = {}            # 页面 cid -> 最近心跳时间
_HAD_CLIENT = False      # 是否已有页面连上过（避免启动阶段误退出）
_EMPTY_SINCE = None      # 页面全部关闭的起始时间
_MUTEX_HANDLE = None     # 单实例互斥体句柄（需保持引用）

_IDLE_GRACE = 8.0        # 最后一个页面关闭后等待重连的时间（兼容刷新）
_CLIENT_STALE = 120.0    # 页面异常退出时，心跳超时后清理（需大于后台标签节流间隔）


def _state_file():
    """记录当前实例端口，供重复启动时打开已有页面。"""
    return os.path.join(tempfile.gettempdir(), 'tcm3d_knowledge_network.port')


def acquire_single_instance(no_browser):
    """Windows 命名互斥体：已有实例时打开其页面并退出，避免重复启动多个服务。"""
    global _MUTEX_HANDLE
    if os.name != 'nt':
        return
    import ctypes
    k32 = ctypes.windll.kernel32
    k32.CreateMutexW.restype = ctypes.c_void_p
    k32.CreateMutexW.argtypes = [ctypes.c_void_p, ctypes.c_bool, ctypes.c_wchar_p]
    _MUTEX_HANDLE = k32.CreateMutexW(None, False, 'Local\\TCM3D_KnowledgeNetwork')
    if k32.GetLastError() == 183:            # ERROR_ALREADY_EXISTS
        if not no_browser:
            try:
                with open(_state_file(), 'r', encoding='utf-8') as f:
                    p = int(f.read().strip())
                webbrowser.open('http://127.0.0.1:%d' % p)
            except Exception:                # noqa: BLE001
                pass
        os._exit(0)


def _watchdog():
    """浏览器页面全部关闭后自动退出；尚未有页面连上时不会误杀。"""
    global _EMPTY_SINCE
    while True:
        time.sleep(1.5)
        now = time.time()
        with _LIFECYCLE_LOCK:
            for cid in [c for c, t in _CLIENTS.items() if now - t > _CLIENT_STALE]:
                _CLIENTS.pop(cid, None)
            if _CLIENTS:
                _EMPTY_SINCE = None
                continue
            if not _HAD_CLIENT:
                continue
            if _EMPTY_SINCE is None:
                _EMPTY_SINCE = now
            elif now - _EMPTY_SINCE >= _IDLE_GRACE:
                os._exit(0)


# ---------------------------------------------------------------- 启动
def free_port(start=DEFAULT_PORT, tries=30):
    for p in range(start, start + tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(('127.0.0.1', p))
                return p
            except OSError:
                continue
    return start


def main():
    argv = sys.argv[1:]
    no_browser = '--no-browser' in argv
    port = DEFAULT_PORT
    for i, a in enumerate(argv):
        if a == '--port' and i + 1 < len(argv):
            port = int(argv[i + 1])
        if a == '--db' and i + 1 < len(argv):
            os.environ['TCM_DB'] = argv[i + 1]
    acquire_single_instance(no_browser)
    port = free_port(port)
    try:
        with open(_state_file(), 'w', encoding='utf-8') as f:
            f.write(str(port))
    except Exception:                        # noqa: BLE001
        pass

    path = db_path()
    if not os.path.isfile(path):
        print('=' * 60)
        print('  未找到数据库文件：')
        print('    ' + path)
        print('')
        print('  请把 tcm.db 放到程序目录的 data\\ 下，')
        print('  或用 --db <路径> 指定；也可运行 scripts/build_db.py 重新生成。')
        print('=' * 60)
        try:
            input('按回车退出…')
        except EOFError:
            pass
        return

    app = create_app()
    url = 'http://127.0.0.1:%d' % port

    print('=' * 52)
    print('  %s · 中药与方剂三维知识网络' % APP_NAME)
    print('  数据库：%s' % path)
    print('  访问地址：%s' % url)
    print('  关闭本窗口即退出服务')
    print('=' * 52)

    threading.Thread(target=_watchdog, daemon=True).start()

    if not no_browser:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    try:
        from waitress import serve
        serve(app, host='127.0.0.1', port=port, threads=8, _quiet=True)
    except ImportError:
        app.run(host='127.0.0.1', port=port, debug=False, use_reloader=False)


if __name__ == '__main__':
    main()
