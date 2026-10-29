# 剩余五页最终验收 / Final remaining-page acceptance · 2026-10-29

最终包已固定：源码 `0b83fc1907f2ee2cae664fb11d9abe6ba083bab5`，作者 `hzz780`。后续证据提交不代表重建。与上一轮 `docs/evidence/subpages/` 分离，旧记录未覆盖。

Packages are fixed to source `0b83fc1907f2ee2cae664fb11d9abe6ba083bab5`, authored by `hzz780`. A later evidence-only commit does not represent a rebuild. Earlier acceptance records remain untouched.

- Preview manifest SHA-256: `d9b2e402a83ac6a35291d37378f414f56d7424788b39cc5d848c34d9da0c3cec`
- Public manifest SHA-256: `d0b22cb41aba06df4710abac42a02e385ba2959394b61630e75e1ec114363f32`
- Revision: `5658af2b3f51c677a850b548e18d3d963a1d082876652199a3fbd974ce34e672`
- [中文产品总览 / Chinese products preview](http://127.0.0.1:8768/chronoai-site/zh/products.html?preview=5658af2b3f51)
- [中文首页 / Chinese homepage](http://127.0.0.1:8768/chronoai-site/zh/?preview=5658af2b3f51)

## 逐页矩阵 / Per-page matrix

共 14 组、28 canonical HTML；以下 13 行各包含中英两页，所有格均表示两种语言通过。1440×900 / 375×900 共 52 页次，320×812 导航 26 页次，无 JS 52 页次，携重复 query/hash 的双向语义章节切换 52 次，六个旧中文 alias 兼容通过。每次实际路径、截图、语言目标见 `subpages.json`。

The manifest contains 14 subjects and 28 canonical HTML documents. Each row below includes both locale documents: 52 desktop/mobile visits, 26 compact navigation checks, 52 no-JS visits, 52 semantic locale switches with repeated query/hash and six legacy Chinese alias checks. Individual paths and screenshots are recorded in the JSON.

| English | 中文 / Chinese | 1440 / 375 | 320 nav | No JS | Locale/hash |
|---|---|---|---|---|---|
| `products/cma.html` | `zh/products/cma.html` | PASS / PASS | PASS | PASS | PASS |
| `products/godgpt.html` | `zh/products/godgpt.html` | PASS / PASS | PASS | PASS | PASS |
| `research.html` | `zh/research.html` | PASS / PASS | PASS | PASS | PASS |
| `developers.html` | `zh/developers.html` | PASS / PASS | PASS | PASS | PASS |
| `products.html` | `zh/products.html` | PASS / PASS | PASS | PASS | PASS |
| `products/nyxid.html` | `zh/products/nyxid.html` | PASS / PASS | PASS | PASS | PASS |
| `products/ornn.html` | `zh/products/ornn.html` | PASS / PASS | PASS | PASS | PASS |
| `company.html` | `zh/company.html` | PASS / PASS | PASS | PASS | PASS |
| `nyxid.html` | `zh/nyxid.html` | PASS / PASS | PASS | PASS | PASS |
| `ornn.html` | `zh/ornn.html` | PASS / PASS | PASS | PASS | PASS |
| `philosophy.html` | `zh/philosophy.html` | PASS / PASS | PASS | PASS | PASS |
| `harness.html` | `zh/harness.html` | PASS / PASS | PASS | PASS | PASS |
| `nyxid-dossier.html` | `zh/nyxid-dossier.html` | PASS / PASS | PASS | PASS | PASS |

每页截图命名为 `<id>-<en|zh-CN>-<1440|375>.png`；320截图带 `-320-header`。`review-*.png` 为顶部裁剪总览，完整长页截图仍保留。主 Agent 已查看全部中英桌面/手机总览。

Full-page screenshots use the page id, locale and width. Compact shots use the header suffix. Contact sheets are cropped navigation/first-section overviews; full-page originals remain available. All locale/viewport overview sheets were visually inspected.

## 来源与英文一致性 / Provenance and English equivalence

五页源 HTML 与 Research 脚本在 2026-10-29 获取，原始 URL、文件字节数、SHA-256 见 `content/brand/sources.json`。没有发现新增范围外的官网页面链接。八个品牌英文页 × 1440/375 共 16 组实时线上/本地对照：标题、正文 DOM 结构、SVG 路径、CTA 目标及受测元素几何/颜色全部通过；报告的几何差异 0，容差 2px。静态验证另机械比对冻结英文 main 文本。

Frozen HTML and the Research script retain their source URLs, capture date, sizes and hashes. No additional unapproved official page was found. Sixteen live/local comparisons across all eight English official pages passed heading, body structure, SVG, CTA and measured geometry/color checks (zero reported differences; 2px tolerance). Static checks separately compare substantive English main text against the frozen source.

线上/本地完整对照截图分别为 `online-<id>-<width>.png` / `local-<id>-<width>.png`，数据见 `brand-comparison.json`。预期差异仅为本地语言入口、对应语言站内链接、本地字体、SEO/AI 镜像、邮件保护还原、动效中文控件/生命周期，以及预览专用资源指纹。Research 节点位置本来随机，不声称逐像素一致。

Online/local screenshots and measured data retain explicit expected differences: locale controls, localized internal routes, local fonts, SEO/AI output, native contact links, translated motion/lifecycle handling and preview-only fingerprints. Research node placement is random; no pixel-identical claim is made.

## 路由、原文与首页 / Routes, original articles and homepage

- `route-regression-before.log`：实现前在起点 `8b401ab` 捕获的三项失败，证明缺少五路由及首页/品牌页外跳。
- `site-routes.json`：28 页 × 两视口共 56 次全链接扫描、72 次真实本地正文 CTA 点击、8 次深层无 hash 阅读位置切换通过。无官网主域外跳、无漏 basePath、无错语言。重复 query 保留；同排卡片保持首个阅读顺序。
- `source-and-builds.json`：10 个 QMD 文件相对起点逐字节不变；首页文字、结构、视觉属性不变，批准的首页 CSS/JS/模板及视频配置字节不变。两份包各 126 个产物文件哈希全部匹配 manifest。
- 所有 HTML、Markdown、llms 中的已迁移官网页面导航均本地化。Nyx/Ornn/CMA 应用子域、Docs、GitHub、招聘、论文和 atlas 原始 `?lang=en` 保留。Living with AI/Sisyphus 仍指 Company，heca 仍为 Coming soon。

The preserved red test proves the original omission. Runtime checks cover every page and body CTAs, including grid reading position. Source guards prove original article bytes and approved homepage text/visual attributes/assets are unchanged. Every package file matches its recorded hash. True service/research references remain external; availability states retain their original meaning.

## 动效、缓存与协议 / Motion, cache and HTTP

`research-motion.json` 真实验证画布非空、暂停/恢复、流程亮起、动态 reduced-motion、2D context 不可用时正文保留。离屏、模拟 document.hidden、减少动效时，既检查流程计时器暂停，也检查 `getComputedStyle(pipe,'::after').animationPlayState === 'paused'`。pagehide/pageshow 和 hidden 明确为模拟事件，不冒充真实 OS/bfcache 认证。

Research evidence exercises real drawing, controls, pipeline progression, preference changes and unavailable-context fallback. Offscreen, simulated hidden and reduced-motion cases assert both paused state and paused CSS pseudo-element. Synthetic lifecycle events are explicitly labelled.

保留原有界 N² 算法以保持线上网络效果：N≤150、每帧最多11,175对、最多14脉冲。最终四组本机 Chromium draw 均值 0.237–0.467ms，样本最大 0.7ms；40样本/组见原始记录，理由见 `docs/remaining-pages.md`。不是所有设备性能承诺。

The original bounded pair scan preserves the official network effect: at most 150 nodes, 11,175 pairs/frame and 14 pulses. Final local Chromium means ranged from 0.237 to 0.467ms, with a 0.7ms maximum sample. Forty samples per combination are retained; this is not a universal-device guarantee.

`preview-cache.json` 保存真实 HTTP 证明：8768 返回 `Cache-Control: no-store`；带未来 If-Modified-Since 的请求仍返回 200 与当前 locale.js 字节；HTML 的 v 参数等于该文件 SHA-256 前12位。每个本地 script/stylesheet 都逐文件校验指纹；公开包不附预览参数。没有清除全局缓存或修改全局浏览器设置。

Real HTTP evidence verifies no-store, current script bytes despite conditional headers and content-derived URL versions. Every local script/stylesheet version is recomputed from its file; public output receives no preview parameter. Global browser data/settings were not cleared or changed.

- 两包各 28 页静态 SEO/schema/镜像/sitemap/llms/资源检查通过；14 项 Python 单元测试通过。
- 两包各 78 项 HTTP 契约通过：全部页面/镜像、六 alias、basePath、404、MIME、noindex，以及预览 200 / 公开模式 304 条件请求。
- `navigation/`：原首页语言、键盘、移动菜单、query/hash 与无 JS 回归通过。
- `videos/`：模拟 YouTube API/iframe 的点击、关闭、重试、超时、焦点及生命周期通过；未重跑远端播放矩阵。
- `reveal/`：首页研究视频卡片正常滚动、直接锚点、减少动效、无 JS 共36场景通过。
- `home/`：原型几何、无 JS、真实 WebGL 闲置/清理/降级/丢失上下文链接及触摸首击通过，无外部请求。

Both 28-page static packages, 14 unit tests, both 78-contract HTTP suites and all homepage/navigation/video/reveal/WebGL regressions passed against the fixed package. Video integration is simulated; remote playback was not repeated.

## 复现与限制 / Reproduction and limits

```sh
.tools/venv/bin/python -m unittest discover -s tests -p 'test_*.py'
.tools/venv/bin/python tests/verify_site.py
.tools/venv/bin/python tests/verify_site.py _preview
HTTP_EVIDENCE_DIR=docs/evidence/five-pages .tools/venv/bin/python tests/verify_http.py
export PLAYWRIGHT_MODULE=/Users/huangzongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs
node tests/subpages.mjs
node tests/brand-compare.mjs
node tests/site-routes.mjs
node tests/research-motion.mjs
NAV_EVIDENCE_DIR=docs/evidence/five-pages/navigation node tests/navigation.mjs
VIDEO_EVIDENCE_DIR=docs/evidence/five-pages/videos node tests/videos.mjs
REVEAL_EVIDENCE_DIR=docs/evidence/five-pages/reveal node tests/research-reveal.mjs
BROWSER_EVIDENCE_DIR=docs/evidence/five-pages/home node tests/browser.mjs
```

范围为 Chromium 视口/触摸仿真，不是跨浏览器/真机认证。历史文章外链、安装命令没有执行或全面健康认证。Quarto 中文翻译 warning 保留于日志；仅规范化日志行尾空白，保留进度回车。原有正式托管 Markdown 响应头与 origin robots 限制仍见 `implementation.md`。

Evidence covers Chromium viewport/touch emulation, not universal browser/device certification. Historical links/commands were not executed or exhaustively certified. Existing Quarto translation warnings remain; archived logs only normalize trailing whitespace, preserving progress carriage returns. Existing hosting header/robots limitations remain documented.

预览服务仅为缓存修复重启过8768，8767/4180未操作。没有 push、PR、合并、部署或线上配置变更。回滚本轮三个实施提交并重建，或恢复上一完整静态包；证据目录保留验收时原样。

Only port 8768 was restarted for preview cache correctness. Ports 8767/4180 were untouched. No push, PR, merge, deployment or live configuration change occurred. Revert the three implementation commits and rebuild, or restore the previous complete package; archived evidence remains unchanged.
