# ChronoAI site / ChronoAI 官网

保留 Quarto/QMD 内容站，并接入已确认的双语首页。此次交付仅供本地评审，未部署。

A Quarto/QMD content site with the approved bilingual landing page. This delivery is for local review and has not been deployed.

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

正式静态包使用 `.tools/venv/bin/python scripts/build.py`，输出 `_site/`。必须通过此入口构建，而非直接 `quarto render`，以包含稳定语言 URL、metadata、Markdown、sitemap、llms 与兼容入口。GitHub workflow 已改用同一入口，但此次未触发。

Build the public package with `.tools/venv/bin/python scripts/build.py` into `_site/`. Use this entry point instead of plain `quarto render` so every representation and locale comes from the same publication manifest. The workflow uses this entry point; it was not triggered during this task.

[实施、验证与发布边界 / Implementation, verification and hosting limits](docs/implementation.md)
