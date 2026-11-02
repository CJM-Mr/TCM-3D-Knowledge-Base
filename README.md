# 本草维度 · 中药与方剂三维知识网络

以中药为节点、以方剂为关联的中医药三维知识网络系统。前后端分离架构，本地 SQLite 数据库，
可打包为**单文件 exe**，双击即用，无需安装 Python / Node / 数据库。

```
270 味中药 · 312 首方剂 · 112 首伤寒论经方 · 230 首方剂学教材方 · 1748 条配伍关系
```

---

## 一、快速开始

### 1. 直接运行（推荐）

双击项目根目录的 **`三维知识网络.exe`**（或 `启动.bat`）。

- 程序会在本机启动一个本地服务（默认 `http://127.0.0.1:8765`）并自动打开浏览器
- 关闭弹出的黑色命令行窗口即退出程序
- 端口被占用时会自动顺延到 8766、8767…
- 程序图标为红色印章样式（`assets/app.ico`）

命令行参数：

| 参数 | 说明 |
|---|---|
| `--no-browser` | 不自动打开浏览器 |
| `--port 9000` | 指定起始端口 |
| `--db PATH` | 指定数据库文件（也可用环境变量 `TCM_DB`） |

### 2. 数据存放位置

数据库随程序放在项目内，不写系统盘临时目录：

```
data\tcm.db               主数据库（1.25 MB，5 张表）
```

程序启动时按以下顺序查找数据库，取第一个存在的：

1. `--db` 参数 / 环境变量 `TCM_DB`
2. exe 内部打包的 `data/tcm.db`
3. 上级目录的 `data/tcm.db`（源码运行时的项目路径）

想换位置或做备份，加 `--db` 即可：

```bash
三维知识网络.exe --db "F:\我的数据\tcm.db"
```

> exe 为 PyInstaller onefile，运行时自解压到系统临时目录（`%TEMP%\_MEI*`），
> 进程退出即自动删除，不会在磁盘上留残留。

### 3. 源码运行（开发）

```bash
# 后端
pip install -r requirements.txt
cd backend && python app.py

# 前端（另开终端，热更新，自动代理 /api 到 8765）
cd frontend && npm install && npm run dev
```

访问 `http://127.0.0.1:5173`。

---

## 二、目录结构

```
三维知识网络/
├── 三维知识网络.exe        单文件可执行程序（15.8 MB，内含全部资源）
├── 启动.bat                双击启动
├── README.md
├── requirements.txt
│
├── docs/                   原始语料（随程序打包）
│   ├── 中药.docx           270 味中药来源文档
│   └── 方剂学.pdf          230 首教材方剂来源（531 页）
│
├── assets/                 打包资源
│   ├── icon-source.png     图标原始设计图
│   ├── app.ico             exe 图标（10 种尺寸：256…16）
│   └── app-256.png         图标预览
│
├── backend/                Flask 后端（REST API）
│   ├── app.py              应用入口、路由、静态托管、启动器
│   ├── db.py               SQLite 数据访问层
│   ├── graph.py            三维场景构建（节点 + 连线，服务端计算）
│   ├── inddetail.py        主治详解（主治拆条 → 功效 / 临床应用 / 配伍对齐）
│   └── search.py           全局检索（中药/方剂/功效/归经/典籍/章节/配伍）
│
├── frontend/               前端源码（Vite + 原生 ES 模块，零框架运行时）
│   ├── index.html
│   ├── vite.config.js      构建输出到 ../web
│   └── src/
│       ├── main.js         入口
│       ├── app.js          控制器：导航、事件、面板、渲染调度
│       ├── api.js          REST 客户端
│       ├── store.js        客户端索引与详情缓存
│       ├── state.js        全局状态（收藏 / 历史 / 对比篮 / 面板宽度）
│       ├── views.js        各视图 HTML 构造
│       ├── sphere.js       三维球状渲染引擎（Canvas 2D + 三维投影，无外部依赖）
│       └── style.css
│
├── web/                    前端构建产物（由 npm run build 生成）
├── data/
│   ├── tcm.db              SQLite 数据库（1.25 MB，随 exe 一起打包）
│   ├── seed.json           由原始 JS 数据导出的中间态
│   └── raw/                原始静态数据文件（归档）
│
└── scripts/
    ├── export_seed.js      原始 JS 数据 → seed.json
    ├── build_db.py         seed.json → data/tcm.db
    ├── make_icon.py        设计图 → assets/app.ico（自动抠红色印章块 + 圆角透明）
    ├── build_exe.py        一键构建（前端 + 图标 + exe）
    └── test_api.py         后端接口与数据一致性测试（61 项）
```

---

## 三、技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 前端 | **Vite 5 + 原生 JavaScript（ES 模块）** | 不引入任何框架运行时，构建产物仅 57 KB JS + 31 KB CSS |
| 三维 | **Canvas 2D + 手写三维投影** | 球面布局、旋转/缩放/惯性、深度排序、节点拾取、标签避让 |
| 后端 | **Flask 3 + Waitress** | 纯 WSGI，PyInstaller 友好，多线程并发 |
| 数据库 | **SQLite** | 本地单文件，打包版启动时整体载入内存，零锁、只读 |
| 打包 | **PyInstaller --onefile --noconsole** | 单文件 exe，含前端、数据库、原始文档；图标 `assets/app.ico`；启动无黑色控制台窗口 |

前端之所以选「Vite + 原生 JS」而非 React/Vue：本项目的核心负载是 552 个节点的高频重绘，
框架的响应式与虚拟 DOM 在这里只有开销没有收益；原生 DOM 直接操作 + Canvas 自绘，是当前
**最简洁、性能最好**的方案。

---

## 四、REST API

所有数据经 HTTP 获取，前后端完全解耦。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 + 计数 |
| GET | `/api/meta` | 分类、功效、归经、方剂分类、典籍/教材元数据 |
| GET | `/api/index` | 启动索引：中药（含归经功效）+ 方剂概要（含组成） |
| GET | `/api/herbs/<id>` | 中药详情 + 含该药的全部方剂 + 主治详解（`indExplain`） |
| GET | `/api/formulas/<id>` | 方剂详情（含组成、方歌、附方、原文条文、主治详解 `indExplain`） |
| GET | `/api/formulas/<id>/related` | 组成相近方剂分析（共有 / 本方独有 / 对方独有） |
| GET | `/api/compare?ids=a,b` | 多首方剂对比数据（最多 4 首） |
| GET | `/api/graph?mode=&id=&key=&ids=&deep=` | 三维场景（12 种模式，服务端计算节点与连线） |
| GET | `/api/search?q=` | 分组检索 |
| GET | `/api/book/shanghan` | 《伤寒论》典籍页（六经分块 + 全部经方） |
| GET | `/api/book/shanghan/<六经>` | 单经页 |
| GET | `/api/book/fangjixue` | 《方剂学》教材页（21 章） |
| GET | `/api/book/fangjixue/<章>` | 单章页 |
| GET | `/api/docs` | 原始文档列表 |
| GET | `/docs/<文件名>` | 原始文档下载 |

`/api/graph` 的 12 种模式：
`overview` `herb` `formula` `effect` `meridian` `category` `fcat` `combo` `book` `liujing` `fjx` `fjxchapter`

> `effect` 模式先按中药的「标签」匹配，匹配不到时回退到「功效」字段，
> 因此像「清热解毒」这类完整功效词也能展开；仍无结果时只返回中心节点。

---

## 五、数据库表

```sql
herb          (id, name, py, alias, src, part, cat, sub, nat, fla, mer, eff, tags,
               ind, clin, combo, dose, proc, cau, pharm, ref)         -- 270 行
formula       (id, name, py, src, book, lj, cat, sub, art, eff, ind, ind_detail, syn,
               usage, cau, ana, feat, application, song, attach, rel,
               fjx, fjx_cat, fjx_sub)                                 -- 282 行
formula_herb  (formula_id, herb_id, dose, role, note, ord)            -- 1748 行
chapter       (book, name, ord, sections, count)                      -- 27 行
book_meta     (id, data)                                              -- 典籍/教材元数据 JSON
```

数组型字段（`fla/mer/eff/tags/combo/pharm/rel/sections`）以 JSON 文本存储，读取时还原。

---

## 六、功能一览

- **三维知识网络**：球面布局 585 个节点，拖动旋转、滚轮缩放、双击深入、点击空白回全景
- **双向查询**：中药 → 含该药的方剂；方剂 → 组成药味 → 各药的其他方剂
- **12 种探索模式**：全景 / 中药中心 / 方剂中心 / 配伍 / 功效 / 归经 / 药物类别 / 方剂分类 / 典籍 / 六经 / 教材 / 教材章节
- **《伤寒论》**：112 首经方，按六经辨证分块（太阳/阳明/少阳/太阴/少阴/厥阴/霍乱/差后劳复），条文原文取自明·赵开美本全文；方剂详情附**倪海厦《人纪·伤寒论》解读**
- **《方剂学》**：230 首教材方剂，21 章分节，含方歌、配伍特点、运用、附方、君臣佐使
- **方剂**：全部 312 首（按方剂分类 + 《方剂学》教材章节导航）
- **主治详解**：中药按「主治原文 → 证治机理 → 逐证解析 → 常用配伍」展开，
  每条证候自动对应到功效与临床应用、并可一键跳到相关方剂；方剂单设「主治」页，
  含证候拆解、病机逐句分析、辨证要点与使用注意
- **全局检索**：中药 / 方剂 / 功效 / 归经 / 典籍 / 教材章节 / 配伍组合（「黄芪 当归」）
- **详情面板**：宽度可拖拽、点击空白自动收起、收藏与搜索历史本地持久化

---

## 七、数据来源

- `docs/中药.docx` — 270 味中药的性味归经、功效主治、配伍、药理
- `docs/方剂学.pdf` — 全国中医药行业高等教育「十三五」规划教材《方剂学》（第十版），
  李冀、连建伟主编，中国中医药出版社 2016 年 8 月第 4 版
- 《伤寒论》经方 79 首（张仲景，东汉）

本程序仅供中医药知识学习与检索参考，不作为临床诊疗依据。
