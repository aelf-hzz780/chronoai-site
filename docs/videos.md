# 视频接入交付 / Video integration delivery

本轮基于 `05720b71c25f06ce17e3dcfd52a86b8246b902b6`，执行用户于 2026-10-28 明确批准的 A 方案。父目录评审稿里“尚未选择”的记录属于此前阶段；未修改评审稿、NyxID 仓库、8767 或 4180 服务。仅本地实施，没有 push、部署、workflow 触发或 DNS 修改。

This increment starts from `05720b71c25f06ce17e3dcfd52a86b8246b902b6` and implements the user's October 28 approval of option A. Earlier review notes about an undecided placement are historical. The review files, NyxID checkout and reference services were not modified. No remote publication was performed.

## 内容与位置 / Content and placement

协作案例位于首页原产品网格和可用性说明之后，仍在原产品区内；随后是研究区。数学视频位于研究标题、导语之后，两张既有研究记录卡之前。两张卡的来源链接、适用范围与方法区保留，首屏、旗舰卡、白色 logo、动效和现有语言导航不变。

The workflow case follows the original product grid and availability note, inside the product section. The mathematical introduction follows the research title/lead and precedes both existing evidence cards. Original sources, scope/method sections, hero, flagship card, white logo, motion and locale navigation remain.

- 协作：`Vre-ZFYv9as`，`One Sentence to a Live Website | NyxBot × CMA`，59.061 秒、9:16。13 分钟仅指片中这次构建与上线演示，不是通用交付承诺。
- 研究：`ilKLSItmT0M`，`Help Mathematicians Without Knowing Math | ChronoAI Vibe Knowledge EP01`，92.021 秒、16:9。它是 ChronoAI/trureturing 研究导读，不是 NyxID 功能，也不是下方两项结果的专门讲解。

The workflow video is a 59.061-second portrait demonstration; its 13-minute claim is explicitly scoped to that case. The 92.021-second landscape video is a ChronoAI/trureturing research introduction, separate from NyxID functionality and the two specific research records below it.

中英目前使用相同的对应英文视频，中文页面明确说明语言。中英文产品封面分别使用本地 `poster-zh.jpg`、`poster-en.jpg`，静态卡片和弹窗均从配置取图。数学封面沿用本地 HTML 文案“AI explores. Lean checks.”／“AI 探索。Lean 验证。”。未加入任何 MP4。

Both locales currently use the same English video for each subject and label its language. Static cards and dialogs select the locale-specific local product poster from configuration. The mathematical cover is local HTML artwork. No MP4 is included.

## 架构与配置 / Architecture and configuration

`content/videos.json` 集中管理 provider 端点、启停、超时、画幅、实际时长和中英独立 provider/ID。`scripts/video_content.py` 校验配置，派生真实原生观看链接和页面运行时配置；未知平台、非法 ID、非 HTTPS 端点或越界超时会构建失败。当前只有 YouTube adapter；未实现或声称支持 Bilibili。

`content/videos.json` centralizes endpoints, flags, timeout, aspect ratios, durations and independent locale sources. A small build adapter validates configuration and derives native links/runtime settings. Unsupported providers, malformed IDs/endpoints or invalid timeouts fail the build. Only YouTube is implemented; Bilibili support is neither implemented nor claimed.

已批准可见文案仍来自 `content/home.html` 与 `home.zh.json`；对话框是独立模板，第三方交互集中在 `assets/videos.js` 的 provider registry。采用简单 adapter registry 隔离外部 API，不引入框架或复杂类层级。正式和预览 HTML、Markdown、llms、publication manifest 共用同一内容 revision，视频来源和真实标题从配置派生；未新增缺乏上传日期等依据的 VideoObject。

Approved visible copy remains in the existing homepage/translation sources. A separate dialog template and small provider registry isolate external playback without a framework or class hierarchy. HTML, Markdown, llms and publication manifests share a revision and derive video sources/titles from configuration. No unsupported VideoObject metadata was invented.

## 播放与资源生命周期 / Playback and lifecycle

初始页面只加载本地封面和静态正文，没有播放器 iframe、YouTube/API 预连接或媒体请求。四个入口均为具有真实 `href` 的原生链接，无 JS、修饰键或不支持 dialog 时仍能观看原视频。普通点击同步打开弹窗、插入允许 autoplay/fullscreen 的 iframe，并在点击之后加载官方 Iframe API；没有额外应用层 Play 按钮。

Initial rendering loads only local assets and static content, without player frames, preconnects or YouTube/API/media requests. Four native source links remain usable without JavaScript. A normal activation synchronously opens the dialog and autoplay-enabled frame, then loads the official API; there is no additional application-level Play step.

iframe 使用当前真实 origin、`strict-origin-when-cross-origin` Referrer、`playsinline` 和原生 controls。播放器创建后没有自定义遮罩覆盖它；加载提示、重试和外站链接均在播放器外。禁用或错误时显示可重试的降级提示；浏览器阻止自动播放时暴露 YouTube 原生控件，不声称绕过媒体策略。

Frames identify the actual page origin, preserve the required referrer and allow inline playback/native controls. No custom overlay covers an existing player. Loading/retry/external controls sit outside the frame. Disabled/error paths degrade explicitly; blocked autoplay exposes native controls rather than attempting to bypass browser policy.

每次播放 attempt 拥有 AbortController、API script、计时器与播放器。关闭、Escape、离页会销毁 iframe/player、取消加载定时器和自有 API 回调；过期回调不可复活播放器。正常关闭恢复触发链接焦点及滚动锁；pagehide/pageshow 不自动恢复视频或空白弹窗。模拟 persisted 事件只验证这段清理逻辑，不冒充真实 bfcache 覆盖。

Each attempt owns cancellation, script/timers and player resources. Close/Escape/page exit removes the player and owned pending API work; stale callbacks cannot resurrect it. Close restores link focus/scroll state. Page transitions do not resume media or an empty modal. Simulated persisted events test cleanup, not full real-bfcache behavior.

按 [YouTube 官方要求](https://developers.google.com/youtube/terms/required-minimum-functionality)，可点击位图封面内容至少 120px 宽，播放器 viewport 至少 200×200；窄屏横屏播放器允许由 YouTube 留黑边，保留视频本身 16:9，不裁切画面。竖屏按 9:16 布局，短屏弹窗可滚动，关闭和外站链接仍可达。原生控件外观由 YouTube 控制，Shorts 与普通视频可不同。API 行为依据 [官方 Iframe API 参考](https://developers.google.com/youtube/iframe_api_reference)。

Platform minimum thumbnail/player sizes are respected. A narrow landscape viewport may letterbox the original 16:9 media rather than crop it. Portrait remains 9:16; short viewports can scroll to close/external controls. YouTube owns native control appearance, including its distinct Shorts interface.

## 验证与复现 / Validation and reproduction

本轮证据保存在 `docs/evidence/videos/`，记录实际源码 commit、内容 revision 和包 manifest 哈希。旧导航／全站证据保留各自历史版本。模拟集成与真实 YouTube 播放分别记录，不能互相替代。

Current evidence records source commit, content revision and manifest hashes in `docs/evidence/videos/`. Earlier whole-site/navigation records remain historical. Simulated integration and live remote playback are distinct evidence sets.

```sh
.tools/venv/bin/python -m unittest discover -s tests -p 'test_*.py'
.tools/venv/bin/python scripts/build.py
.tools/venv/bin/python tests/verify_site.py
.tools/venv/bin/python scripts/build.py --preview
.tools/venv/bin/python tests/verify_site.py _preview
# Reuse the running server, or start it if stopped:
python3 scripts/serve.py --directory _preview --port 8768
# Set PLAYWRIGHT_MODULE to an existing Playwright installation if needed.
node tests/videos.mjs
node tests/videos-live.mjs
VIDEO_STRICT_POLICY=1 node tests/videos-live.mjs
NAV_EVIDENCE_DIR=docs/evidence/videos/navigation node tests/navigation.mjs
HTTP_EVIDENCE_DIR=docs/evidence/videos .tools/venv/bin/python tests/verify_http.py
```

真实播放检查读取时间推进、未静音和非零音量、音轨解码字节、目标视频 ID、非广告状态及媒体实际画幅，并验证同页面关闭重开。它证明本次 Chromium 环境中的行为，不是声学测量或真机认证。严格策略运行只记录其实际结果，不推出所有浏览器均可无条件有声自动播放。中国大陆等网络可达性、YouTube 广告／标识／推荐由平台及环境决定。

Live checks inspect time progression, unmuted volume, decoded audio bytes, target identity, ad state and rendered media ratio, including same-page reopen. They establish behavior in this Chromium environment, not acoustic or physical-device certification. A stricter-policy run records observations without promising unconditional autoplay in every browser or network.

部署限制沿用原交接：本轮仅本地，GitHub Pages 不原生支持 `_headers`，远端 Markdown MIME/noindex 仍需对应 host/CDN 验证。回滚可 revert 本轮源码 commit，按同一构建入口恢复整包；不需要数据迁移。

Existing hosting limits remain: this is local-only, and native Pages cannot guarantee the supplied `_headers` behavior. Rollback reverts the implementation commit and rebuilds the complete static package; no data migration is involved.
