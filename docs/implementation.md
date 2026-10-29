# 实施与验证 / Implementation and verification

## 范围与架构 / Scope and architecture

目标：把已批准首页、稳定双语 URL、静态 SEO 与机器可读镜像接入现有 Quarto 仓库，保留已有文章。此次仅本地预览；不改变线上服务、DNS、远程分支，不发起部署。没有引入 React、SSR、CMS 或自制 Markdown renderer。

The goal is to integrate the approved homepage, stable bilingual URLs, static SEO and machine-readable mirrors into the existing Quarto repository while retaining the articles. This is a local preview only, without changing live services, DNS or remote branches. No React, SSR, CMS or custom Markdown renderer was introduced.

`content/publication.json` 是发布白名单：9 个主题、18 个语言页。首页可见英文内容来自 `content/home.html`，实际使用的中文译文来自 `content/home.zh.json`；页面描述来自对应 QMD front matter。文章仍是根目录 QMD。构建脚本先生成隔离 Quarto 输入，再由官方 Quarto/Pandoc 渲染，最后从同份 HTML 语义正文派生 Markdown、head、sitemap、llms 和 publication manifest。导航、动效与装饰不进入机器正文；卡片标题、描述、状态和规范链接保留。

`content/publication.json` is the publication allowlist: nine subjects and 18 locale pages. The homepage has one English HTML source and an active Chinese dictionary; QMD front matter provides each page description. Existing articles remain QMD files. The build stages isolated Quarto inputs, renders them through official Quarto/Pandoc, then derives Markdown, metadata and indexes from the same semantic content. Navigation and decoration are excluded from mirrors; substantive card copy, status and canonical links remain.

采用简单的构建 pipeline：内容准备、Quarto adapter、产物派生和独立验证各司其职；不存在复杂运行时业务，因此没有增加类层级或服务框架。公开配置由 `site-config.json` 统一管理，`SITE_ORIGIN` 与 `SITE_BASE_PATH` 可覆盖部署位置。错误构建会抛出异常并记录 Trace ID；预览响应包含 `X-Trace-ID`。

A simple build pipeline separates source preparation, the Quarto adapter, derived outputs and independent validation. No class hierarchy or service framework is needed for static content. `site-config.json` centralizes public settings, with `SITE_ORIGIN` and `SITE_BASE_PATH` overrides. Failed builds report a Trace ID; preview responses include `X-Trace-ID`.

## 内容与兼容 / Content and compatibility

英文仍使用原有 `index.html`、`nyxid.html`、`ornn.html`、`philosophy.html`、`harness.html`、`nyxid-dossier.html`；中文位于 `/zh/` 对应路径。语言切换是原生链接，初始 HTML 已是目标语言。JS 只增强 query/hash 与章节保持；文章从 Quarto 的成对章节生成锚点映射，原始锚点继续存在。

English keeps the original page names; Chinese pages use their corresponding `/zh/` paths. Native links select a fully rendered language document. JavaScript only enhances query/hash and reading-position preservation. Paired article sections produce a locale anchor map, retaining original heading IDs.

六个旧 `*-zh.html` 分别提供对应中文页的静态 refresh 和可点击链接，JS 增强保留 query/hash。它们是 HTTP 200 兼容页，标记 `noindex,follow`，canonical 指向目标语言；不是生产 HTTP 301。无 JS 时 refresh 可进入对应页，但无法保证任意浏览器保留 hash/query。未知 URL 无 SPA 回退，真实返回 404。

Each of the six legacy Chinese URLs has its own static refresh and clickable destination. JavaScript preserves query/hash. These are HTTP 200 compatibility pages with `noindex,follow`, not production HTTP 301 redirects. Without JavaScript, refresh reaches the corresponding page but arbitrary browsers may not preserve query/hash. Unknown URLs receive real 404s.

五类原文章正文已恢复到 `origin/main`，原路径和中文兼容页保留。NyxID/Ornn 明确标为历史技术概览，当前产品使用独立 `/products/` 路径；Company 使用 `/company.html`，不替代 Philosophy。Dossier 保留作者 `Chrono AI` 与真实日期 `2026-04-01`。完整路由、来源哈希和验证范围见 [子页纠偏](subpages.md)。

All five original article bodies are restored to the repository baseline, retaining their routes and legacy Chinese aliases. NyxID/Ornn are explicitly archived technical overviews; current products use separate `/products/` routes. Company uses `/company.html` and does not replace Philosophy. The dossier retains its original author and publication date. Full routing, provenance and validation scope are documented in the subpage restoration document.

## 构建与复现 / Build and reproduction

本机使用官方 Quarto **1.10.18**，作为可复现构建基线固定；来源为 [Quarto 官方下载页](https://quarto.org/docs/download/)。macOS tarball SHA-256：`ddd6a71a9e0448ab15fb655bc589e11cb6589a248ec35ccd7f7f44137531688e`。安装在被忽略的 `.tools/`，不纳入发布包；Python 依赖版本见 `requirements.txt`。

The local build uses official Quarto **1.10.18**, pinned as a reproducibility baseline from the official download page. The macOS tarball checksum is shown above. The CLI is installed in ignored `.tools/`, outside publication output. Python dependencies are pinned in `requirements.txt`.

```sh
mkdir -p .tools
curl -fL https://github.com/quarto-dev/quarto-cli/releases/download/v1.10.18/quarto-1.10.18-macos.tar.gz -o .tools/quarto.tar.gz
shasum -a 256 .tools/quarto.tar.gz
tar -xzf .tools/quarto.tar.gz -C .tools
python3 -m venv .tools/venv
.tools/venv/bin/pip install -r requirements.txt
.tools/venv/bin/python scripts/build.py
.tools/venv/bin/python tests/verify_site.py
.tools/venv/bin/python scripts/build.py --preview
.tools/venv/bin/python tests/verify_site.py _preview
python3 scripts/serve.py --directory _preview --port 8768
```

另一个终端执行实际验收。浏览器脚本需要可用的 Playwright Chromium；可通过 `PLAYWRIGHT_MODULE` 指向已有安装。原型比较需要 `APPROVED_PROTOTYPE` 指向获批 `refined.html`，默认是父目录的交接原型。截图与结果保存在 `docs/evidence/`。

Run acceptance checks in another terminal. Browser checks require Playwright Chromium; `PLAYWRIGHT_MODULE` may point to an existing installation. `APPROVED_PROTOTYPE` selects the approved reference, defaulting to the parent handoff directory. Screenshots and results are saved in `docs/evidence/`.

```sh
.tools/venv/bin/python -m unittest discover -s tests -p 'test_*.py'
.tools/venv/bin/python tests/verify_http.py
node tests/browser.mjs
```

`publication.json` 带有 content revision、输入基线 commit、Quarto 版本及各输出文件 SHA-256。`sourceCommit` 是构建时 Git HEAD，不代表 dirty working tree 的全部实现；精确包内容以文件 hash 为准。被验证的源码 commit、包哈希与测试记录写在 `docs/evidence/verification.json`；最终交付 HEAD 由最终回复固定（最后一笔 commit 仅保存验证证据）。正式构建与预览使用相同正文 revision；预览包有 robots meta 和 HTTP `X-Robots-Tag: noindex,nofollow`，不加载分析脚本。正式包 HTML 可索引，canonical 始终使用公开 origin，不写 localhost。

`publication.json` records content revision, the build's Git baseline, Quarto version and output hashes. `sourceCommit` is the Git HEAD at build time and does not describe uncommitted implementation changes; file hashes identify exact output. The delivery commit and evidence are recorded separately. Public and preview builds share a content revision. Preview adds indexing controls and no analytics; public HTML is indexable and uses the public origin for canonical URLs.

## 托管与索引边界 / Hosting and indexing limits

`llms.txt` 是 `text/plain`；`read/{en,zh}/*.md` 是 `text/markdown`。镜像不进 sitemap；robots 允许抓取公开内容，不用 Disallow 阻断机器阅读或 `noindex` 信号。llms 是导航约定，不保证任何搜索收录、AI 排名或模型采用。robots 抓取许可也不是训练授权；此次未扩张既有训练许可策略。

`llms.txt` is plain text and mirrors are Markdown. Mirrors are excluded from sitemap; public crawling is allowed so robots does not obstruct machine reading or indexing headers. llms is a navigation convention, not a search/AI discovery guarantee. Crawl permissions do not grant training rights; no additional training license is granted here.

本地服务器对 Markdown 返回 `X-Robots-Tag: noindex`，正式包附 `_headers` 给支持该约定的 host/CDN 使用。**GitHub Pages 不读取 `_headers`，不能凭这个文件保证镜像 noindex 或 text/markdown MIME。** 若未来仍使用原生 Pages，Markdown 将保持公开可读取，但其精确 MIME/noindex 响应能力不在本轮声明范围；若要求严格保证，应在支持响应头的 host/CDN 配置对应规则并进行远端 HTTP 复验。此项是已知托管限制，部署前必须处理；没有配置或部署 CDN。

The local server returns `X-Robots-Tag: noindex` for mirrors, and `_headers` is supplied for compatible hosts/CDNs. **GitHub Pages ignores `_headers`; that file cannot guarantee mirror noindex or Markdown MIME on native Pages.** Native Pages keeps mirrors publicly readable, but this delivery does not claim exact remote MIME/indexing behavior. Strict guarantees require a compatible host/CDN and remote HTTP verification before deployment. No CDN was configured or deployed.

GitHub Pages 项目站的 robots 位于子路径，不能代替 `https://chronoaiproject.github.io/robots.txt` 的 origin 级策略。生产站点可索引性不依赖子路径 robots 文件；若需要 origin 级 crawl/training 策略，需由对应 origin owner 配置。

A project site's subpath robots file cannot control the origin-level robots policy. Public HTML remains indexable without it; origin-wide crawling/training rules require the origin owner's configuration.

## 资源、动效与回滚 / Assets, motion and rollback

保留首页字符环与原有版式，资源分离并可缓存。NyxID CTA 沿用批准的蓝白 shader，整卡仍是唯一链接；WebGL 不可用时链接可用。CTA 静止停止绘制，离屏／后台／reduced-motion 清理；首屏 scene 使用串行异步初始化，延迟加载后仍遵守最新活动状态。原型资源来源见 `assets/PROVENANCE.md`，完整第三方许可见 `vendor/react-bits/`。

The approved layout and character animation use separate cacheable resources. The CTA retains the approved shader and sole native card link, with static fallback and lifecycle cleanup. Serialized scene initialization respects current activity even after delayed loading. Resource provenance and the complete CTA license are retained.

Quarto 渲染中文时可能输出 Pandoc 缺少部分语言翻译的 warning；页面及 TOC 的目标语言由静态 metadata 和显式文案控制。浏览器自动化使用 Chromium 仿真视口／触摸，并非真机认证；模拟 visibility/pageshow 不等同于真实后台或 bfcache 全面验证。

Quarto/Pandoc may warn about missing translation terms for Chinese. The target language and TOC labels are explicitly supplied. Browser checks use Chromium viewport/touch emulation rather than physical devices. Simulated visibility/pageshow checks are not comprehensive OS-background or bfcache validation.

未来发布应把同一 `_site/` 整包作为单元，先检查 manifest/hash、响应头和 URL，再经单独授权发布。回滚时恢复此前完整静态包及配套 host headers；源码回滚使用 Git revert 对应实施 commit，重新通过统一构建入口生成。不需数据迁移。此次未执行任何发布或远程回滚。

A future release should publish one complete `_site/` package after manifest/hash, header and URL checks and separate deployment authorization. Roll back the entire previous package with matching host headers, or revert implementation commits and rebuild. No data migration is involved. No release or remote rollback was executed.
