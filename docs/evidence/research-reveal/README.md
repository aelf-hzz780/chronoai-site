# Research video reveal · 2026-10-29

本轮仅为 `#research-video` 增加现有 `rv rv3` 类：使用 `assets/home.js` 的同一个 IntersectionObserver，以及已有的渐显、200ms 延迟、reduced-motion 与无 JS 样式。没有修改动效脚本、首屏、布局、文案、视频逻辑、语言记忆、CI 或发布配置。回滚可 revert 源码提交。

This fix only adds the existing `rv rv3` classes to `#research-video`, reusing the homepage observer, fade, 200ms delay and existing reduced-motion/no-JS styles. Motion scripts, hero, layout, copy, video logic, language persistence, CI and publication settings are unchanged. Revert the source commit to roll back.

修复源码：`694404a04c697918f783dca739d8ac78553d6374`。`verification.json` 与 `builds.json` 绑定此源码、内容 revision 和构建 manifest SHA-256；后续仅归档证据的提交不代表再次构建。旧 `docs/evidence/videos/` 是上轮视频验收，本轮未重写。

Verified source: `694404a04c697918f783dca739d8ac78553d6374`. `verification.json` and `builds.json` bind the source, content revision and build manifest SHA-256. A later evidence-only commit does not represent a rebuild. Earlier video acceptance under `docs/evidence/videos/` is historical and untouched.

- `reproduction.json`、`before-*.png`：修改前本地 HEAD `16d001ace4c52361d4c0b055159bc8a1753102c6`，预览沿用视频源码 `4c8fb7da263b8f9106525be459b64b706172dbec`。中英 × 375/1440px 均复现卡片 opacity=1，而标题或导语尚未完成入场。
- `verification.json`、`after-*.png`：中英 × 375×812/1440×900 × 正常动效/reduced-motion/无 JS，共 36 个导航场景。正常滚动到 Observer 边界前卡片 opacity=0；入场时标题、导语先触发且 opacity 不低于卡片；直接 `#cases`、`#research-video` 可达且最终可见。减少动效和无 JS 内容无需渐显即可阅读，无 JS 保留原生 YouTube 链接。
- 8 次锚点访问后的点击、关闭、焦点回归使用模拟 YouTube API/iframe；没有重新测试远端播放或声称覆盖所有浏览器/操作系统。
- `_preview`、`_site` 均重新构建，各 12 个 canonical 页面静态验证通过；7 项 Python 单元测试通过，JS syntax check 通过。本轮范围 diff whitespace check 通过。

- `reproduction.json` and `before-*.png`: reproduced on local HEAD `16d001ace4c52361d4c0b055159bc8a1753102c6`, using the existing preview built from video source `4c8fb7da263b8f9106525be459b64b706172dbec`. All four locale/viewport pairs showed card opacity=1 before the introduction settled.
- `verification.json` and `after-*.png`: 36 navigation scenarios across EN/ZH, 375×812/1440×900 and normal/reduced/no-JS modes. The card stays hidden before its observer boundary; the heading/lead reveal first and lead its opacity. Both direct anchors reach the visible card. Reduced-motion and no-JS content is immediately readable; native YouTube source links remain available without JS.
- Eight anchor-entry click/close/focus checks use a simulated YouTube API/frame. Remote playback was not repeated; this is Chromium evidence, not a claim about every browser or OS.
- Both local packages rebuilt and passed static checks for all 12 canonical pages; seven Python unit tests and JS syntax checks passed. The scoped diff passed whitespace checks.

复现命令 / Reproduction commands (run from repository root):

```sh
.tools/venv/bin/python scripts/build.py --preview
.tools/venv/bin/python tests/verify_site.py _preview
.tools/venv/bin/python scripts/build.py
.tools/venv/bin/python tests/verify_site.py
.tools/venv/bin/python -m unittest discover -s tests -p 'test_*.py'
PLAYWRIGHT_MODULE=/Users/huangzongzhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node tests/research-reveal.mjs
```

复用 `127.0.0.1:8768` 的现有预览服务；未停止或更改其他服务，未 push、未部署。`--reproduce` 仅用于未修复的旧包，当前修复包应运行默认验证模式。

The existing preview service at `127.0.0.1:8768` was reused. Other services were not changed or stopped. Nothing was pushed or deployed. `--reproduce` is for the old unfixed package; run the default verification mode against the fixed package.
