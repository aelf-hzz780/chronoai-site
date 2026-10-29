# ChronoAI site / ChronoAI 官网

保留 Quarto/QMD 内容站，并接入已确认的双语首页。支持本地评审和独立 GitHub Pages 验收站。

A Quarto/QMD content site with the approved bilingual landing page, supporting local review and a separate GitHub Pages acceptance site.

```sh
python3 -m venv .tools/venv
.tools/venv/bin/pip install -r requirements.txt
# Install Quarto, or set QUARTO_BIN. See docs/implementation.md.
.tools/venv/bin/python scripts/build.py --preview
.tools/venv/bin/python tests/verify_site.py _preview
python3 scripts/serve.py --directory _preview --port 8768
```

预览入口：[English](http://127.0.0.1:8768/chronoai-site/) · [中文](http://127.0.0.1:8768/chronoai-site/zh/)。公开地址在 `site-config.json` 集中管理；默认沿用既有 GitHub Pages 地址，并非已确认的最终域名。

Preview links above use the configured subpath. `site-config.json` centralizes the public origin and base path; the existing GitHub Pages address is a default, not a final domain decision.

正式静态包使用 `.tools/venv/bin/python scripts/build.py`，输出 `_site/`。必须通过此入口构建，而非直接 `quarto render`，以包含稳定语言 URL、metadata、Markdown、sitemap、llms 与兼容入口。GitHub workflow 使用同一入口。

Build the public package with `.tools/venv/bin/python scripts/build.py` into `_site/`. Use this entry point instead of plain `quarto render` so every representation and locale comes from the same publication manifest. The workflow uses this same entry point.

手动运行 `Deploy Quarto site to GitHub Pages` 时，选择待验收的功能分支。工作流会按当前仓库的 `https://<owner>.github.io/<repo>/` 构建、验证并发布 `_preview/`，所有正式 HTML 页面保留 `noindex,nofollow`。Pages Source 必须为 GitHub Actions，`github-pages` environment 必须允许所选分支。验收站使用 GitHub 默认域名，不绑定正式官网域名。只有 push main 才沿用 `site-config.json` 构建正式 `_site/`；无需为验收合并 main。

Run `Deploy Quarto site to GitHub Pages` manually and select the feature branch to review. The workflow builds, verifies and deploys `_preview/` at the current repository's `https://<owner>.github.io/<repo>/` address, retaining `noindex,nofollow` on every canonical HTML page. Set the Pages source to GitHub Actions and allow the selected branch in the `github-pages` environment. Use the default GitHub domain for acceptance, without assigning the production domain. Only pushes to main use `site-config.json` to build the public `_site/`; acceptance does not require merging main.

当前验收分支 `feature/approved-home-bilingual-seo` 的 push 也会自动构建并发布同样的预览包，以完成首次工作流登记并持续更新验收站。其他功能分支需手动运行。

Pushes to the current acceptance branch, `feature/approved-home-bilingual-seo`, also build and deploy the same preview package, registering the workflow on its first run and keeping the acceptance site current. Other feature branches require a manual run.

手动发布或验收分支 push 会替换当前仓库的 Pages 内容。验收结束可在个人仓库的 Pages 设置中取消发布。`noindex` 不是访问控制；GitHub Pages 不执行生成的 `_headers` 文件，不能依靠它为 Markdown 或其他文件设置响应头。

A manual deployment or an acceptance-branch push replaces the current repository's Pages content. Unpublish the personal repository's Pages site when acceptance ends. `noindex` is not access control; GitHub Pages does not apply the generated `_headers` file, so it cannot supply indexing headers for Markdown or other files.

[实施、验证与发布边界 / Implementation, verification and hosting limits](docs/implementation.md)
