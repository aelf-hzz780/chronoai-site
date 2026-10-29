# 官网子页纠偏 / Official subpage restoration

官网品牌页现覆盖 NyxID、Ornn、Company、CMA、GodGPT、Research、Developers、Products 八页及中文。已确认首页仅修正 NyxID、Ornn、About 链接，slogan、hero、旗舰卡、shader、视频与研究卡渐显保留。

The official brand publication covers NyxID, Ornn, Company, CMA, GodGPT, Research, Developers and Products with Chinese counterparts. Homepage changes only correct the three destinations; approved copy, hero, flagship card, shader, videos and reveal behavior remain intact.

| 内容 / Content | English | 中文 / Chinese |
|---|---|---|
| NyxID product | `products/nyxid.html` | `zh/products/nyxid.html` |
| Ornn product | `products/ornn.html` | `zh/products/ornn.html` |
| Company | `company.html` | `zh/company.html` |
| CMA | `products/cma.html` | `zh/products/cma.html` |
| GodGPT | `products/godgpt.html` | `zh/products/godgpt.html` |
| Research | `research.html` | `zh/research.html` |
| Developers | `developers.html` | `zh/developers.html` |
| Products | `products.html` | `zh/products.html` |
| NyxID archived technical overview | `nyxid.html` | `zh/nyxid.html` |
| Ornn archived technical overview | `ornn.html` | `zh/ornn.html` |
| Philosophy | `philosophy.html` | `zh/philosophy.html` |
| Harness essay | `harness.html` | `zh/harness.html` |
| NyxID dossier | `nyxid-dossier.html` | `zh/nyxid-dossier.html` |

`content/publication.json` 明确列出 14 个主题、28 个 HTML（首页 2 + 官网页 16 + 原文章 10）。产品 ID 为 `nyxid-product` / `ornn-product`，不会覆盖旧 `read/{en,zh}/nyxid.md`、`ornn.md`；只保留六个真实旧中文 alias，不生成虚构历史路径。

The manifest explicitly contains 14 subjects and 28 HTML documents: two homepages, 16 official pages and ten original articles. Distinct product IDs keep existing article mirrors intact. Only the six real legacy Chinese aliases are generated.

## 来源与模板 / Sources and templates

2026-10-29 从 `chrono-ai.fun` 获取的八页完整 HTML 冻结于 `content/brand/*.html`，URL、日期、原始 SHA-256 及字节数见 `content/brand/sources.json`；线上 CSS/JS 原件保存在 `docs/sources/online-2026-10-29/`。不将 `origin/main` 的原 QMD 宣称为当前官网源码。

Complete official HTML captured on 2026-10-29 is frozen in `content/brand/*.html`. Source URLs, capture date, original SHA-256 hashes and byte counts are recorded in `sources.json`; original CSS/JS is archived under `docs/sources/online-2026-10-29/`. The original QMD repository is not presented as the current official site's source.

`scripts/brand_content.py` 作为冻结 HTML 到静态双语输入的 adapter，保留原组件、SVG、CTA、body class 和正文，翻译使用独立 JSON。`templates/brand.html` 不引入 Bootstrap 文章外壳，复用既有本地字体、`site.css` 与语言控件。首页脚本不复用于 Company；`brand-motion.js` 保留线上图示路径、12 秒序列和指针范围，同时提供中文控件及 Observer/RAF/监听器清理。

The adapter preserves official components, SVGs, CTA labels, body classes and substantive English text, with separate Chinese dictionaries. The standalone brand template reuses existing fonts, site styles and locale controls without the article framework. Dedicated motion code preserves official paths, the 12-second diagram sequence and pointer ranges while localizing controls and cleaning up observers, frames and listeners.

预期差异仅为：语言入口、全站目标本地化、静态 SEO/AI 镜像、本地字体，以及将 Cloudflare 邮件保护还原为同一邮箱的原生 mailto。共享导航延续已批准的 1023px 断点和紧凑手机控件；不会将这些规则回退到线上旧版本。响应式 NyxID SVG 仍保留两份，机器镜像仅输出一次相同语义。

Expected differences are locale controls, localized official-site destinations, SEO/AI representations, locally served fonts and the same contact address expressed as native mailto instead of Cloudflare protection. Shared navigation retains the approved 1023px breakpoint and compact controls. Both responsive NyxID SVGs remain in HTML; identical diagram semantics appear once in Markdown.

## 原文与文章外壳 / Original articles

五类 × 中英共 10 个 QMD 的 `---` 后正文逐字恢复到 `origin/main`（`1317113a4c3cb9164ccc601af19f6ce1d3817ca8`）。新增 description 只用于 SEO。NyxID/Ornn 浏览器标题、描述、llms 与镜像明确标为历史技术概览，正文前提供朴素的存档说明和当前产品链接；不改原文，不虚构日期。Philosophy/Harness 保留观点，Dossier 保留作者 `Chrono AI`、真实日期 `2026-04-01`。

All ten article bodies are restored verbatim to the recorded original repository baseline. Descriptions are SEO additions. NyxID/Ornn metadata and mirrors explicitly identify archived technical overviews, with a plain archive note and current product link before the original body. No archive date is invented. Philosophy/Harness retain their arguments; the dossier retains its original author and publication date.

文章使用原生 Quarto navbar/footer 与 flatly/darkly 外壳；语言按钮位于正文外，在折叠菜单之外也可直接访问。原 QMD 语言块只在输出时移除，原文件保持完整。手机提供原生 details 目录，桌面沿用 Quarto 目录，不进入 AI 镜像。旧中文 alias 延续 query/hash 增强，已知无 JS 限制与托管响应头限制见 `implementation.md`。

Articles retain native Quarto navigation/footer and the flatly/darkly framework. One locale link stays outside the body and collapsed menu. Original language blocks are removed only from rendered output. A plain native details table of contents supports mobile; desktop retains Quarto's TOC. Navigation is excluded from mirrors. Legacy query/hash behavior and hosting limitations remain documented separately.

## 验证与回滚 / Verification and rollback

`tests/subpages.mjs` 按清单检查全部 26 个子页：中英 × 1440/375、320 导航、无 JS 全文与原生语言链接、双向语义章节、目录、菜单、图片解码及本地失败请求。`tests/brand-compare.mjs` 对八页英文作线上/本地同视口截图、正文标题、SVG 路径、CTA 目标和几何比较。`verify_site.py` 另逐字核对冻结英文 main，并检查响应式图示镜像去重。

Manifest-driven browser checks cover every subpage, both desktop/mobile widths, compact navigation, no-JS content/locale links, semantic section preservation, TOCs, menus, image decoding and failed local requests. Official-page comparisons cover screenshots, headings, SVG paths, native CTA destinations and geometry. Static checks compare frozen English substantive content and enforce diagram mirror deduplication.

最终源码、包哈希、逐页矩阵、截图和复现命令存放 `docs/evidence/five-pages/`。浏览器证据是 Chromium 视口检查，不等于真机或所有浏览器认证；历史文章的原始外链及旧安装说明没有被执行，也不声明全部外链健康。完整包回滚或 revert 本次实施提交后重建即可；本轮不 push、不 PR、不部署。

Final source/package hashes, page matrices, screenshots and reproduction commands live under the isolated evidence directory. Chromium viewport evidence is not physical-device or universal browser certification. Historical external links and installation commands are preserved without execution or a blanket health claim. Roll back the package or revert the implementation and rebuild. No push, PR or deployment is performed.


剩余五页的来源、全站路由回归、Research 有界性能理由与实际绘制测量另见 [补齐记录](remaining-pages.md)。上一轮三页交付的原始证据仍保留在 `docs/evidence/subpages/`。

See the remaining-pages record for provenance, site-wide route regressions and bounded Research rendering costs. The earlier three-page delivery evidence remains unchanged in its original evidence directory.
