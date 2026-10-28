# 本轮视频证据 / Video evidence

本目录对应从 `05720b71c25f06ce17e3dcfd52a86b8246b902b6` 开始的正式视频增量。精确源码与包哈希见 `verification.json`。上一轮导航、全站与原型证据仍属各自历史版本，未冒充本轮结果。复现命令和实现说明见 [视频交付文档](../../videos.md)。

This directory records the production video increment from the named baseline. Verification identifies the exact source and bundle hashes. Earlier site/navigation/prototype records remain historical. Reproduction and implementation details are in the linked delivery document.

- `integration.json`：6 个双语视口页面、24 个播放入口检查，模拟 API 失败、播放器错误、超时、禁用、非法配置、重试、被阻止的 autoplay、延迟回调和 persisted page transition。它不是远程播放证据。
- `live.json`：10 个真实初始播放样本（375/1440px 中英文 × 两视频，加 320px 中文两视频），以及 375px 中英文两视频的 4 次同页面关闭后重开。记录目标 ID、无广告状态、时间推进、实际时长、未静音/音量、音轨解码字节和实际媒体比例。
- `live-strict-policy.json`：独立的更严格 Chromium 策略观察。4 项在记录时为 `player`（ready），未观察到时间推进；它只通过了未覆盖的官方 iframe/外站出口降级检查。ready 后约 700ms 的媒体样本不能单凭此判断阻止原因，也不证明所有浏览器可自动播放。
- `navigation/`：本轮页面上的语言导航回归，保留本轮 source commit/manifest hash。
- `http-public.json`、`http-preview.json`：两包各 45 项 HTTP 契约；Quarto 日志与静态验收汇总见 `verification.json`。

Integration fixtures are explicitly simulated. Live default-policy checks establish actual target playback with decoded audio, including same-page reopen. The stricter-policy observations are separate readiness/fallback samples, not universal autoplay evidence or a conclusive diagnosis of browser policy. Navigation and HTTP records bind to this increment.

`live-*.png` 展示真实官方播放器。Shorts 与普通视频的 UI 不同，`controls` 字段只记录采样时可访问性按钮探测；Shorts 探测偶尔为 false 不等同于应用遮挡，实际截图保留其暂停、音量、进度与全屏样式。应用层未修改或统一 YouTube 原生控件。

Live screenshots retain the platform's distinct Shorts/standard interfaces. Control probes are observational; a missing role match in the Shorts interface is not evidence of application occlusion. No attempt was made to normalize or modify platform UI.

`zh-375-video-case.png`、`en-375-video-case.png` 等布局图在本地懒加载封面 `decode()` 完成后截取；`en-320-research-video.png` 包含最窄英文封面的标题/播放图标留白修正。初始图片 naturalWidth=720。全部浏览器视口为仿真，不是真机认证；真实播放检查并非声学测量。

Placement screenshots wait for local poster decoding. The 320px English research screenshot shows the narrow-title spacing correction. Viewports are emulated; playback metrics are not physical-device or acoustic certification.
