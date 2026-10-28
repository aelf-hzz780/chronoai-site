# 资源来源 / Asset provenance

首页资源来自 2026-10-27 已批准的 `design-review/snapshot`，其原始 URL/哈希在 `snapshot-sources.json`、字体映射在 `fonts.css`。未改变父目录评审文件。`content/home.html` 与 active 中文词典从最终获批页迁移为静态构建输入，不发布自包含评审页或替换构建器。

Homepage resources were migrated from the approved 2026-10-27 snapshot. Original URLs/hashes are recorded in the accompanying source manifests. The parent design files were not modified. The approved page became a static semantic template and active translation dictionary, rather than a self-contained production file or snapshot-replacement builder.

`home.js`、`site.js` 以原有行为为基础管理正式页面的静态导航和动效生命周期；`asciimark.js` 保留原字符环算法并增加生命周期处理。Unicorn Studio runtime 保留上游文件，构建时只将 watermark 图片位置改为同包资源，不移除署名或链接。没有加载外部 scene、字体服务或分析脚本。

Home/navigation enhancements preserve approved behavior with lifecycle handling; the character-mark algorithm is retained. The Unicorn Studio runtime is kept, with only its watermark image URL resolved to the local package during build; attribution and links remain. No remote scene/font service or analytics is loaded.

NyxID CTA 的完整来源与许可位于 `vendor/react-bits/PROVENANCE.md`、`vendor/react-bits/LICENSE.md`；许可也内嵌在 `nyx-cta-light.js`。它作为网站的一部分集成。`social.png` 是本次生成的静态分享图，生成源为 `scripts/social.mjs`。

Complete CTA provenance and license terms are retained in `vendor/react-bits/` and embedded in its source. It is integrated as part of this site. The social card is generated from `scripts/social.mjs`.

本轮视频封面从已批准的 `design-review/video-placement/assets/` 复制，仅 JPG；没有复制 MP4。数学封面由本地 HTML/CSS 绘制。

Video posters are the approved local JPG assets; no MP4 was copied. The research cover is local HTML/CSS.

- `poster-en.jpg` SHA-256: `89a7bac8e22035426337274ac88a62fd2712d4e38bb1f915d6b01d170aabde1c`
- `poster-zh.jpg` SHA-256: `b1d32ba9aaac11dad7617ca082ca0af82f720ea03d34dbd739e93488caaf0bcb`
