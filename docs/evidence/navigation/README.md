# 本次语言导航验证 / Language navigation verification

本目录仅记录从 `4380fcd87a07fa5b0035ec8f5d0cc411bfb031d6` 开始的语言入口小改动。上一轮 `../verification.json`、`../browser.json` 和同级旧截图仍对应其文件中记录的旧源码 commit／content revision，未被改写为本轮证据。它们不代表本轮导航通过了此前的完整浏览器矩阵。

This directory records only the language-navigation follow-up based on commit `4380fcd87a07fa5b0035ec8f5d0cc411bfb031d6`. Previous verification files and screenshots retain their original source commit/content revision and are not presented as current full-suite evidence.

桌面 header 在 CTA 左侧增加「中文 / EN」，移动菜单顶部增加同样入口，footer 保留。所有入口都是稳定语言 URL 的原生链接；`aria-current` 对三处入口同步设置，沿用已有 query/hash 增强。导航采用站点已有的 1024px 布局断点，768–1023px 使用展开菜单，避免原有导航在该区间挤压；320px 只收紧 header logo 和间距，不调整首屏主体。

The desktop header adds a compact locale control immediately before the CTA; mobile adds it at the top of the drawer and keeps the footer control. Native locale URLs and existing query/hash behavior are retained. Every entrance gets the correct current-language state. Navigation uses the site's 1024px layout breakpoint, resolving the previous medium-width clipping; 320px adjustments only compact the header logo and spacing.

`navigation.json` 包含实际产物 manifest 哈希与 source commit。`tests/navigation.mjs` 验证中英两种语言 × 320/375/767/768/1023/1024/1100/1440px：入口位置、当前语言、44×44 点击目标、键盘焦点、无溢出／导航重叠、query/hash、无 JS 桌面原生跳转，以及菜单开关与跨断点清理。本次截图位于此目录；测试使用 Chromium 仿真视口，非真机认证。

The navigation record identifies the tested manifest and source commit. The focused browser test covers both languages at eight widths, placement/current state, target sizes, keyboard focus, clipping/overlap, query/hash, native desktop navigation without JavaScript and menu lifecycle. Screenshots are from Chromium viewport emulation, not physical-device certification.

本轮另执行正式与预览 Quarto 构建、两包各 12 页的既有静态校验；没有重跑无关的完整动效／文章浏览器矩阵。完整复现命令：

Public/preview builds and the existing 12-page static checks were also run. The unrelated full animation/article browser matrix was not rerun. Reproduce with:

```sh
.tools/venv/bin/python scripts/build.py
.tools/venv/bin/python tests/verify_site.py
.tools/venv/bin/python scripts/build.py --preview
.tools/venv/bin/python tests/verify_site.py _preview
# Keep the existing loopback preview running, or start it if it is stopped:
python3 scripts/serve.py --directory _preview --port 8768
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/navigation.mjs
```
