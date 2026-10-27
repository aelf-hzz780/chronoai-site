# 新版两段式语言控件增量 / Segmented locale-control follow-up

本轮基于 `5dc5652988cd02d0e82a6a9b31bf541dd2ac9f42`，按用户指定的本机 NyxID 新版 header 调整语言控件。只读参考为 `/Users/huangzongzhe/workspace/vibeCoding/nyxid/frontend/src/features/website-a/generated/en/WebsiteHeader.tsx` 及 `/Users/huangzongzhe/workspace/vibeCoding/nyxid/frontend/src/features/website-a/website-a.css` 中 `.lang` 规则；未修改 NyxID、未重启或停止 4180。

This increment starts from commit `5dc5652988cd02d0e82a6a9b31bf541dd2ac9f42` and follows the user-selected newer local NyxID header. Its header JSX and `.lang` CSS were read only. The NyxID repository and its reference server were not modified or restarted.

桌面 header 显示 EN 在前、中文在后的 32px 两段式控件，低对比圆角细边框，当前项底色与亮字；没有斜杠或下划线。1023px 及以下 header 保留 44px 控件，只显示目标语言。为保留完整 44px 点击区域，移动端细边框用 inset shadow 绘制。drawer 的重复入口已按明确授权移除，footer 原生链接保留。

The desktop header uses an EN-first 32px segmented control with a subtle rounded border and filled current state, without a slash or underline. At 1023px and below it remains in the header, showing only the target language with a full 44px target. An inset shadow preserves the full mobile target area. The explicitly replaced drawer control is removed; native footer links remain.

保持 ChronoAI 主题、首屏主体和 CTA 内容，仅收紧小屏 header 的 logo、边距与 CTA padding/font size，避免 320/359/360px 挤压。菜单打开时焦点循环包含可见 header 控件与 drawer 项，沿自然 DOM 顺序移动：从 hamburger 反向 Tab 先到 CTA，再到语言入口；首尾循环不进入背景正文，Escape 回到 hamburger。

ChronoAI branding, hero content and CTA copy are retained. Only small-screen header logo/spacing and CTA padding/font size are compacted to avoid clipping. With the menu open, focus cycles through visible header controls and drawer items in natural DOM order, including the CTA before the locale link when moving backward from the hamburger. The cycle excludes background content and Escape restores hamburger focus.

`navigation.json` 绑定实际预览 manifest 哈希和 source commit；`verification.json` 汇总本轮构建和静态验证。`../navigation/`、`../browser.json`、`../verification.json` 仍是各自记录旧 commit/revision 的历史证据，本轮没有重跑全站动画或文章浏览器矩阵。

The navigation record binds results to the actual preview manifest and source commit. Earlier evidence directories remain historical for their recorded commits/revisions; the full animation/article browser matrix was not rerun for this increment.

本轮验证中英两种语言 × 320/359/360/375/768/1023/1024/1440px：形态、当前状态、header 常驻、触控尺寸、无重叠/横向溢出、自然键盘顺序、菜单开关和断点回收。另覆盖 8 次键盘语言跳转的重复 query/hash 保持、无显式 hash 的阅读章节保持、320/375/1440px 的 6 次无 JS 原生语言跳转。正式与预览 Quarto 构建、两包各 12 页静态校验通过。浏览器采用 Chromium 视口仿真，不是真机认证。

Checks cover both languages at eight widths, appearance/state, persistent header access, target sizes, clipping/overlap, keyboard order and menu lifecycle. Additional checks cover eight keyboard locale navigations with duplicate query/hash preservation, reading-section preservation without an explicit hash, and six no-JavaScript navigations at mobile and desktop widths. Public/preview builds and 12-page static checks pass. Browser coverage uses Chromium emulation rather than physical devices.

所有 `*-header.png` 都是小幅 header 截图，便于直接展示；`*-375-open-menu.png` 展示打开菜单时 header 入口仍可见。`en-1440-keyboard-header.png` 专门保留键盘焦点样式。

Every `*-header.png` is a compact header-only screenshot for presentation. Open-menu images demonstrate persistent header access; the dedicated keyboard image retains the focus indicator.

```sh
.tools/venv/bin/python scripts/build.py
.tools/venv/bin/python tests/verify_site.py
.tools/venv/bin/python scripts/build.py --preview
.tools/venv/bin/python tests/verify_site.py _preview
# Reuse the running 8768 preview; start only if stopped.
python3 scripts/serve.py --directory _preview --port 8768
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/navigation.mjs
```
