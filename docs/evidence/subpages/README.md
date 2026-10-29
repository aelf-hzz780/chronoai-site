# 子页最终验收 / Final subpage acceptance · 2026-10-29

本目录是本轮独立证据，不替换旧验收。固定源码 `808b6cf06e241e624c6d0cd8f11b726cd8f1932e`，作者 `hzz780`；后续证据提交不代表重新构建。预览包已固定，8768 可验收。

This directory contains isolated evidence for this change. Source commit `808b6cf06e241e624c6d0cd8f11b726cd8f1932e`, authored by `hzz780`, owns the fixed packages. A later evidence-only commit does not represent a rebuild. The preview on port 8768 remains fixed for independent review.

- `_preview/publication.json` SHA-256: `7cf967346e9fa00c2664664ed7927a67782547e8313a262fa24bdbcbea63c6f2`
- `_site/publication.json` SHA-256: `f1b4b17791a7bd4b1046c726991c2a16d7fdb4dc6be765e80576f41c7cc47c4d`
- Source/content revision: `8d473114fd1664ba04195dbce36242bbcb994324d3f5936628e0344f744ea0c3`

## 逐页矩阵 / Per-page matrix

每行同时覆盖所列中英两页；每一页均完成 1440×900、375×900 截图与交互、320×812 导航、1440/375 无 JS、双向语义章节切换。桌面/手机共 32 页次，320 导航 16 页次，无 JS 32 页次，双向语义切换 32 次。详见 `subpages.json`，记录每个实际路径与截图名。

Every row covers both listed locale documents. Each document passed desktop/mobile screenshots and interaction, compact navigation, no-JS content/locale links and semantic section switching. Totals: 32 desktop/mobile visits, 16 compact visits, 32 no-JS visits and 32 semantic locale switches. The JSON records each path and screenshot filename.

| English page | 中文页 / Chinese page | 1440 / 375 | 320 nav | No JS | Semantic locale |
|---|---|---|---|---|---|
| `products/nyxid.html` | `zh/products/nyxid.html` | PASS / PASS | PASS | PASS | PASS |
| `products/ornn.html` | `zh/products/ornn.html` | PASS / PASS | PASS | PASS | PASS |
| `company.html` | `zh/company.html` | PASS / PASS | PASS | PASS | PASS |
| `nyxid.html` | `zh/nyxid.html` | PASS / PASS | PASS | PASS | PASS |
| `ornn.html` | `zh/ornn.html` | PASS / PASS | PASS | PASS | PASS |
| `philosophy.html` | `zh/philosophy.html` | PASS / PASS | PASS | PASS | PASS |
| `harness.html` | `zh/harness.html` | PASS / PASS | PASS | PASS | PASS |
| `nyxid-dossier.html` | `zh/nyxid-dossier.html` | PASS / PASS | PASS | PASS | PASS |

五类原 QMD × 中英正文与 `origin/main` 逐字一致，SHA-256 见 `source-and-builds.json`。NyxID/Ornn 仅在原正文前增加存档说明与当前产品链接，SEO/llms/镜像明确历史身份；未虚构日期。Dossier 作者与日期保留。文章导航在 main 外，语言入口唯一；有目录的文章在桌面原生 Quarto 目录和手机 details 目录中实际点击通过。Philosophy/Harness 按原稿不启用目录。

All ten original QMD bodies match the repository baseline verbatim. Archive notes and current product links precede the original NyxID/Ornn body; metadata/mirrors identify archived material without invented dates. The dossier author/date are retained. Article navigation is outside main with one locale link. Existing article TOCs were exercised through native desktop Quarto controls and plain mobile details; Philosophy/Harness retain their original no-TOC setting.

## 线上对照 / Official-page comparison

三页英文 main 与冻结线上 HTML 机械比对通过；实时线上与本地的标题、SVG 路径、CTA 目标及受测正文元素几何/颜色在两种视口均通过（6 组、几何差异 0，容差 2px）。完整来源、日期和原始文件哈希见 `content/brand/sources.json`。`brand-comparison.json` 保留实际测量和预期差异。

All three English main bodies pass mechanical comparison with frozen official HTML. Six live/local viewport pairs pass heading, SVG, native CTA and measured content geometry/color checks (zero reported differences, 2px tolerance). Source provenance is retained separately; the JSON contains actual measurements and explicit expected differences.

| Page | 1440 online / local | 375 online / local |
|---|---|---|
| NyxID | [online](online-nyxid-product-1440.png) / [local](local-nyxid-product-1440.png) | [online](online-nyxid-product-375.png) / [local](local-nyxid-product-375.png) |
| Ornn | [online](online-ornn-product-1440.png) / [local](local-ornn-product-1440.png) | [online](online-ornn-product-375.png) / [local](local-ornn-product-375.png) |
| Company | [online](online-company-1440.png) / [local](local-company-1440.png) | [online](online-company-375.png) / [local](local-company-375.png) |

预期差异：新增语言入口，三个已批准站内目标本地化，其余页面仍链接线上；相同邮箱使用原生 mailto；本地字体、SEO/AI 镜像；动效控件翻译和生命周期处理。共享页头保留已批准的 1023px 断点及紧凑手机控件。网页保留桌面/手机两份连接图，镜像相同语义只出现一次，有精确回归断言。

Expected differences are locale controls, the three approved localized destinations, native mailto, local fonts, SEO/AI representations, localized motion controls and lifecycle handling. Other destinations remain online. Shared navigation retains the approved breakpoint/compact controls. Both responsive SVGs remain in HTML; the duplicate semantic diagram appears once in each Markdown mirror, enforced by a precise assertion.

## 首页与协议回归 / Homepage and protocol regression

- `source-and-builds.json`：首页源相对 `8bf6a7e` 仅三种入口 token 替换；已确认 CSS/JS/模板字节不变。10 个原 QMD body 哈希与两份包绑定在同一记录中。
- `navigation/navigation.json`：中英 16 组响应宽度、键盘、菜单生命周期、query/hash、无 JS 链接通过。
- `reveal/verification.json`：中英手机/桌面正常滚动、直接锚点、减少动效、无 JS 共 36 个场景通过。
- `videos/integration.json`：视频点击、关闭、焦点、错误/重试/超时、模拟页面生命周期通过。这里使用模拟 YouTube API/iframe；没有重跑远端视频矩阵。
- `home/`：首页原型几何、全部子页无溢出、真实 WebGL CTA 闲置/清理/降级/丢失上下文链接、触摸首击及无 JS 通过，无外部请求。
- `http-preview.json`、`http-public.json`：各 57 项 HTTP 契约通过，涵盖全部 18 HTML、镜像、六个 alias、basePath、MIME、索引头与真实 404。
- 两份包各 18 页静态检查、9 项 Python 单元测试及 JS syntax checks 通过。

Homepage source scope and unchanged asset hashes, navigation, research reveal, simulated video integration, actual WebGL/touch/fallback behavior and both 57-contract HTTP suites all passed against the fixed package. Both 18-page static output checks, nine Python unit tests and JS syntax checks passed. Remote video playback was not re-tested. Existing services were not stopped; the temporary public-package HTTP server used a separate random loopback port and was cleaned up.

## 复现与边界 / Reproduction and limits

```sh
.tools/venv/bin/python -m unittest discover -s tests -p 'test_*.py'
.tools/venv/bin/python tests/verify_site.py
.tools/venv/bin/python tests/verify_site.py _preview
HTTP_EVIDENCE_DIR=docs/evidence/subpages .tools/venv/bin/python tests/verify_http.py
export PLAYWRIGHT_MODULE=/Users/huangzongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs
node tests/subpages.mjs
node tests/brand-compare.mjs
NAV_EVIDENCE_DIR=docs/evidence/subpages/navigation node tests/navigation.mjs
VIDEO_EVIDENCE_DIR=docs/evidence/subpages/videos node tests/videos.mjs
REVEAL_EVIDENCE_DIR=docs/evidence/subpages/reveal node tests/research-reveal.mjs
BROWSER_EVIDENCE_DIR=docs/evidence/subpages/home node tests/browser.mjs
```

浏览器验收为 Chromium 视口/触摸仿真，不声称真机或跨浏览器全覆盖。旧文章原始外链与安装命令未执行，不声明全部外链健康。Quarto 的部分中文翻译 warning 保留于日志；日志仅规范化行尾空白，保留原进度回车。正式托管的 Markdown MIME/noindex 和 origin 级 robots 限制仍见 `docs/implementation.md`，本轮未配置托管、未 push、未创建 PR、未部署。

Browser evidence uses Chromium viewport/touch emulation rather than universal device/browser certification. Historical external links and installation commands were not executed or certified healthy. Quarto's existing Chinese translation warnings remain in the logs; only trailing whitespace was normalized, preserving progress carriage returns. Hosting header/origin-robots limitations remain documented. Nothing was pushed, submitted as a PR or deployed.
