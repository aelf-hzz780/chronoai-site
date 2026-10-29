# 剩余官网页面补齐 / Remaining official pages · 2026-10-29

在 `8b401abb0542a46f33b1847c18898e815da2b3f3` 基础上，补齐线上同路径的 CMA、GodGPT、Research、Developers、Products，提供完整中文、静态 SEO 与 AI 镜像。五类原 QMD 正文不变；已确认首页只修改这些页面的目标链接，不改变视觉、文案、hero、视频或动效。

This change adds the five remaining official pages and their Chinese counterparts, based on the recorded prior delivery. Original QMD bodies and approved homepage visuals/copy/media remain intact; only official-page destinations are localized.

| Page | English | 中文 / Chinese |
|---|---|---|
| CMA | `products/cma.html` | `zh/products/cma.html` |
| GodGPT | `products/godgpt.html` | `zh/products/godgpt.html` |
| Research | `research.html` | `zh/research.html` |
| Developers | `developers.html` | `zh/developers.html` |
| Products | `products.html` | `zh/products.html` |

发布清单现在为 14 组、28 个 canonical HTML：首页 2、官网品牌页 16、历史文章 10；仍只有六个真实旧中文 alias。新五页原始 HTML、URL、抓取日期和 SHA-256 位于 `content/brand/sources.json`；原 Research JS 归档于 `docs/sources/online-2026-10-29/research.js`。正文站内路径没有发现范围外未迁移页面。

The allowlist contains 14 subjects and 28 canonical HTML documents: two homepages, 16 official pages and ten articles, with the same six real legacy aliases. Frozen source HTML, URLs, capture dates and hashes are recorded beside the brand inputs; the original Research script is archived separately. No additional unapproved same-site page was found in these sources.

## 路由与语言 / Routing and locale

先增加 `test_local_routes.py`，在原包上复现三类失败：缺五个路由、首页外跳、品牌页菜单/正文 CTA/All products 外跳，再修改实现。`localize_links` 是共用 adapter：只映射清单中的官网页面，保留原 query 顺序、重复参数和 hash，去除已转为站内链接的外开属性。首页 token 直接指向本地页面；最终 HTML 再统一检查，Markdown 从此份 HTML 派生。

The route regression was added and failed before implementation, reproducing missing routes plus homepage and brand-page escapes. A shared adapter maps declared official pages, preserving query order, repeated values and fragments. Homepage tokens point directly to local pages, and mirrors derive from finalized HTML.

所有菜单、移动抽屉、页脚、正文卡片、CTA、技术文章输出与镜像都保持对应语言及 basePath。Nyx/Ornn/CMA 应用子域、Docs、GitHub、招聘与论文外链保留。外部 trureturing atlas 的 `?lang=en` 不擅自修改。Products 中 Living with AI、Sisyphus 仍按原站指向 Company，heca 保留 Coming soon。

Menus, drawers, footers, cards, CTAs, article output and mirrors retain the selected locale and basePath. Actual service subdomains, docs, GitHub, recruiting and research references remain external, including the atlas's original language query. Living with AI and Sisyphus still point to Company; heca remains Coming soon.

语言切换增加同排网格阅读定位回归：没有显式 hash 时选择最接近页头的章节/卡片，同高目标保留首个阅读顺序；显式 hash 仍优先。这样不会从 heca 错跳到同行的 chrono-harness。

Reading-position switching selects the nearest landmark and keeps the first target when grid cards share the same height. Explicit hashes still take precedence. The regression prevents a heca-to-chrono-harness jump.

## Research 动效与性能 / Research motion and performance

原站使用 `rx-canvas` 的抽象节点网络和 `pipe` 结果流程，并未使用旧版 `data-net` 图示。`assets/research.js` 保留原绘制、连线、粒子传播、节点上限和 1100ms 流程节奏，补齐中文按钮、动态 reduced-motion、离屏/后台停止、pagehide 清理和 persisted 恢复。暂停状态同时停止 interval 与 `pipe::after` CSS 动画。窗口尺寸改变时清空旧脉冲，避免缩小节点集合后引用失效。无法取得 2D context 时保留全部正文与流程。

The actual official page uses an abstract canvas network and record pipeline, rather than the older data-net diagram. The adapter preserves rendering, links, pulses, node bounds and pipeline timing, while localizing controls and handling motion preferences, offscreen/background suspension, lifecycle cleanup and persisted recovery. Paused pipeline state stops both its interval and CSS pseudo-element. Resizing clears pulses that could refer to removed nodes; unavailable canvas context retains the content.

有界性能例外：为保留线上效果，沿用原两两邻接算法，`N ≤ 150`，每帧最多 `150×149/2 = 11,175` 次距离检查；活跃脉冲最多 14 个。数据规模不随业务内容增长。当前四组开发实测平均 draw 成本为 0.22–0.48ms、最大样本 0.7ms（本机 Chromium），低于 60Hz 的 16.7ms 帧预算；最终同源码测量见独立 `research-motion.json`，不将此结果推广为所有设备保证。若未来提高 N 上限，应先改为空间索引并重新做视觉/性能验证。

Bounded performance exception: preserving the official visual uses the original pairwise adjacency calculation with at most 150 nodes, 11,175 distance checks per frame and 14 active pulses. This size does not grow with content. Four development samples measured 0.22–0.48ms mean draw cost and 0.7ms maximum on local Chromium, below the 16.7ms 60Hz frame budget. Final measurements are recorded against the fixed source. This is not a universal-device guarantee; raising the cap requires spatial indexing and renewed visual/performance validation.

## 验证与回滚 / Verification and rollback

清单驱动覆盖全部 26 个子页：中英 × 1440/375、320 导航、无 JS、章节语义切换；八个官网英文页 × 两视口与实时线上对照正文结构、标题、SVG、CTA 和几何。另扫描全部 28 页运行时链接，实际点击品牌页的本地正文入口，检查重复 query、深层无 hash 阅读位置，以及全部镜像/llms 无官网外跳。Research 实测画布非空、暂停/继续、流程、CSS 停止、动态减少动效及模拟生命周期。

Manifest-driven verification covers all 26 subpages, both locales/viewports, compact navigation, no-JS and semantic section switching. All eight English official pages are compared with live counterparts for structure, headings, SVGs, CTAs and geometry. Runtime route checks exercise body links and deep reading position; static checks cover all mirrors/indexes. Research checks cover real drawing, controls, pipeline/CSS suspension, preference changes and explicitly simulated lifecycle events.

最终包、来源、逐页矩阵和证据位于 `docs/evidence/five-pages/`，与上一轮证据分离。最终归档后不因证据提交重建。回滚本轮实施提交并重建，或恢复上一份完整静态包即可；不涉及数据迁移。本轮不 push、PR、合并或部署，不停止现有 8768/8767/4180 服务。

Final package/source hashes and per-page evidence live in a separate directory. Evidence-only commits do not trigger rebuilds. Revert the implementation and rebuild, or restore the previous complete static package. No data migration, push, PR, merge or deployment is performed, and existing services are retained.


本地预览响应使用 `Cache-Control: no-store`，并忽略预览请求中的条件缓存头，确保重建后实际返回当前脚本；正式包本地验证服务仍保留原有条件响应行为。已加载的旧预览标签可单页强制刷新一次，不需清除全局浏览器缓存。最终 HTTP 验证以未来日期的 If-Modified-Since 请求确认预览返回200及当前locale.js哈希、公开模式仍返回304。

Local preview responses disable storage and conditional-cache validation so rebuilt assets are served as current bytes. Public-mode validation keeps normal conditional responses. A previously loaded preview tab can be force-reloaded once without clearing global browser data. Final HTTP checks verify a future-date conditional request returns current asset bytes in preview and 304 in public mode.


为覆盖浏览器已缓存旧URL的首次重开，预览HTML中每个本地script与stylesheet引用附当前文件SHA-256前12位作为v参数，已有其他query参数和fragment保留；正式HTML不附该预览参数。静态验收逐引用重算文件哈希，不只检查参数存在。这样新页面会请求明确的新资源URL，无需用户清除任何浏览器缓存。

To cover first navigation from a browser that already cached old URLs, preview HTML fingerprints each local script/stylesheet URL with the first 12 SHA-256 characters of the actual file. Other query values/fragments remain intact; public HTML receives no preview parameter. Output verification recomputes every resource hash rather than checking parameter presence alone.
