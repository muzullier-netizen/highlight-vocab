## 2026-11-06：邮箱验证码入口

验证码登录使用 signInWithOtp + verifyOtp(type: email)，保留既有账号、会话存储与同步模型。邮件模板需在 Supabase Authentication → Email Templates 中，将 Magic Link 和 Confirm signup 的正文都改为包含 `{{ .Token }}` 的数字验证码邮件，不再使用 `{{ .ConfirmationURL }}`。模板未切换前保留原登录链接兼容路径。验证码仅在输入框内暂存，登录后清空，不写入本地进度或日志。

# 拾词：GitHub Pages 版

## 2026-11-05：Supabase 多设备同步

仍使用 https://muzullier-netizen.github.io/highlight-vocab/ 。页面顶部「云端同步」输入邮箱发送验证码，在原页面填入最新邮件的数字验证码后登录；其他设备用同一个邮箱分别获取验证码登录。首次获取后 60 秒可重发。已有登录状态继续保留。离开前确认显示「已同步」。

同步范围：三个词本的熟悉度、到期时间、重点与排除标记、本轮位置、三种拼写模式的统计和草稿、自添加原句，以及导入的原录音。内置词库与剑雅短句随网站发布，不需要重复上传。

- 本地优先：断网仍可学习，登录后网络恢复、切回页面或点击「立即同步」会补传；前台每 30 秒检查远端变化，学习操作后约 1.5 秒触发同步。
- 首次登录的历史计数取较大值，避免把两份相同旧备份重复相加；已有不同设备的独立历史无法自动区分是否重叠。首次合并后，使用上次确认的云端基线计算新增次数，再合并并发学习记录。
- 每次上传带版本号及唯一请求编号。版本冲突先拉取再合并；服务器保留回执，响应丢失后重试不会重复增加次数。本机先写恢复标记再应用云端结果，支持中途中断恢复。
- 在新电脑仅打开网页生成的空白新一轮不会覆盖云端续学位置。正常无变化轮询不会翻卡或重置当前答案。
- 用户数据由 auth.uid() 隔离；没有匿名数据库读写。public.vocab_sync_pull / vocab_sync_push 为 SECURITY INVOKER 入口，实际写入和回执在非公开 vocab_internal schema 中，内部函数再次核对 auth.uid()。客户端仅包含 publishable key，没有 secret/service-role key。
- 原音存入私有 vocab-private-audio 桶，路径以账号 UUID 开头，按 SHA-256 内容寻址并只新增；存储策略只允许读取和新增本人目录。本站不生成公开音频链接。旧音频对象暂不自动清理，以免删除另一台尚未完成同步所需的资料。
- 两个云端账号不共用保留在同一浏览器里的本地数据；检测到换账号会停止同步，需使用独立浏览器配置。退出账号保留本机记录和未确认上传信息，便于原账号重新登录恢复。不要在不可信的公共电脑保留登录状态。
- Supabase JS 固定为 2.119.0，UMD 文件和 MIT 许可证保存在 vendor/，从本站加载。

项目：pgrpaxhbohvxfvebfncg。cloud-config.js 只保存公开项目 URL 和 publishable key。初始化 SQL 见 supabase/setup.sql；本次已应用的私有函数调整 SQL 见 supabase/private-functions.sql。使用现有项目时应先检查 schema，不要盲目重复运行调整脚本。

登录返回网址：Supabase Authentication → URL Configuration 的 Site URL 及允许返回地址使用上面的 GitHub Pages 根地址。首次登录邮件由 Supabase Auth 发送；未配置自定义 SMTP 的项目可能仅允许团队成员邮箱，详见 https://supabase.com/docs/guides/auth/auth-smtp 。

验证：node validate-sync.mjs；node validate-cloud-runtime.mjs。后者用两份独立本地存储及模拟云端验证并发计数、断网、响应丢失、刷新恢复、请求中的新练习、录音传输及账号切换。真实数据库事务测试覆盖权限隔离、版本冲突、重复请求和私有音频目录策略；所有测试数据已回滚。Supabase 安全检查无告警。尚未进行真实邮箱登录和实体双电脑浏览器实测；当前 Windows 浏览器的操作工具因不支持网址策略检查而停止。

官方参考：https://supabase.com/docs/guides/auth/auth-email-passwordless 、https://supabase.com/docs/guides/database/postgres/row-level-security 、https://supabase.com/docs/guides/storage/security/access-control 。


## 2026-11-05：剑雅原句与合成音

入口：?practice=synthetic#listening。听力专题的练习方式选择「剑雅原句 · 合成音」。内置 18 条短句，按 19 个词生成 19 个挖空练习，来自剑雅 9–19 的 Test 1 转录页；覆盖 215 个高频词中的 19 个，不代表已覆盖全词库。

- cambridge-sentences.js 存放简短原句、册数、Test、Part、核对来源网址；只有核实了原题号的项目才标注题号。挖空主要用于词汇专项训练，不能把全部目标词称为原题答案。来源为第三方转录页，未宣称已用官方纸书逐条复核。
- 原句合成音与原录音练习、单词拼写使用独立统计及续学位置。播放时去掉方括号、朗读完整句子；作答前隐藏词形、完整原句和释义，检查或查看答案后展示来源链接。
- 使用浏览器 Web Speech API 实时合成，不保存 MP3；自动优先 en-GB，也可选择设备提供的其他英语声音。没有英语声音时提示添加；缺少已选声音时使用可用英语声音并显示实际声音名。设备声音可在加载后动态出现。参考：https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
- 「添加自己的剑雅原句」无需录音文件，选择现有词卡并标记唯一目标词，填写已核对来源。最多 500 条本地原句，不上传到 GitHub。普通进度备份和学习包均含原句及统计；导入按原句 id 和更新时间合并。两台电脑分别导出的相同文本若 id 不同会保留两条。
- 深链接仅选择练习方式，不清空既有筛选与学习记录。筛选没有匹配句子时提示放宽条件；排除词继续不会出现。
- 原录音模式仍只播放导入文件，没有任何合成音回退。九分学长已登录；真实录音资料仍待接入。

验证：node validate-listening.mjs、node validate-dictation.mjs、node validate-synthetic.mjs。自动测试验证路由、掩码、英音选择、续学、独立统计、排除和原句备份合并；未进行浏览器实际扬声器听音验证。


## 2026-11-05：拼写与原句听写

在听力专题下，使用「练习方式」选择卡片记忆、单词拼写、原句听写。

- 单词拼写：隐藏词形和释义，点击播放设备合成发音，输入答案后检查；可调播放速度、重听、查看答案、重新输入和只练错词。大小写及多余空格不影响判断，单复数仍严格区分；数字类要求输入英文拼写。color/colour 与 theater/theatre 兼容。查看答案后的正确输入不计为首次答对。
- 拼写统计、本轮位置和输入草稿独立保存在原有听力进度中。原有三个词本的复习、星标、排除与恢复继续保留。
- 原句听写：只播放导入的真实录音文件，按指定开始、结束秒数截取播放，在原句中隐藏答案，再检查答案词拼写。不会用合成语音或自编句充当原题。
- **原题材料仍待接入**：九分学长账号已注册并登录，但尚未取得可导入的原录音文件、原句和时间段。网站不内置虚构的原音或题目。
- 「原题资料与换设备续学」可选原录音文件，填写原题名、时间段和完整原句，用一对 `[ ]` 标出所选答案词，确认来源后保存。每个文件不超过 25 MB。音频在浏览器 IndexedDB 保存，不上传 GitHub 或其他服务器。
- 换电脑：在家点击「导出学习包（含原音与进度）」，把 JSON 文件带到公司后点击「导入学习包」。学习包同时包含原音、句子、听力学习进度和拼写续学记录；按更新时间合并。原音总量上限 75 MB，导入包上限 110 MB。
- 普通「导出进度」也包含拼写记录，但不包含原音。现在可使用云端同步；未登录时仍可手动迁移。

验证：`node validate-listening.mjs`、`node validate-dictation.mjs`。后者中的音频字节仅是存储与播放控制的单元测试夹具，不是学习题目或原题材料。未进行浏览器声音实测。

## 2026-11-05：听力高频专题

原网址为 https://muzullier-netizen.github.io/highlight-vocab/ ，首页「复习词本」可选择「听力高频词汇 · 215 项」，也可直接打开 `#listening`。

保留 161 张原始高亮卡片、474 张阅读重复词卡，新增 215 张听力卡片。听力内容依据九分学长「听力填空词表 BETA」2026-11-05 界面核实的篇数，筛选至少出现 3 篇的高频精选：203 常规词与短语、6 数值、6 时间项。不是整个 1,895 项词表的镜像。考频不表示未来考试概率。来源篇数不随词形合并。

每张听力卡有独立的搭配或拼写提示，提示是学习性补充，不是原题引文；12 个原释义为空的数值与时间项补充了常用义。farm、garage、temperature 的 Part 未完整显示，保留未知，不猜测。设备合成朗读不是原题音频。

三个词本分别保存在 `shici-progress-v1`、`translation-reading-v1`、`translation-listening-v1`。沿用原有星标、排除与恢复、隐藏答案、续学位置、分页、备份导入导出；旧版一词本与二词本备份仍可导入。个人进度不上传。

无需 ChatGPT 登录，无外部字体或脚本依赖。包含 161 张词卡、163 条高亮原始记录。

## 首次发布
1. 在 GitHub 创建公开仓库，例如 highlight-vocab，并勾选 Add a README file。
2. 将本文件夹内的 index.html、style.css、app.js、words.json、.nojekyll 上传到仓库根目录（不是上传 ZIP 本身）。
3. 打开 Settings → Pages → Build and deployment。
4. Source 选 Deploy from a branch；Branch 选 main；目录选 /(root)，保存。
5. 等待部署完成，在 Pages 设置中打开实际给出的网站地址。更新可能需要约 10 分钟。

## 更新
修改 words.json 或网页文件，提交到 main，GitHub 会重新发布。刷新页面读取最新词库，不会删除当前浏览器中的进度。
词条 id 应保持稳定；全局词库数量的页面文案当前为 161，增删词条时也需同步修改 index.html。

## 学习进度
保存在当前浏览器。手机与公司电脑登录同一同步账号后自动同步，也可使用导出／导入迁移。同域下不同路径的网站可能共用当前存储键 shici-progress-v1。
换域名后，原 ChatGPT Sites 进度也不会自动带过来：先在原网站导出，再在这里导入。
网站和词库公开，学习进度不上传。GitHub Pages 不提供学习记录数据库。
朗读依赖浏览器设备语音能力。公司是否能访问 github.io 需在公司网络实际验证。

## 词汇统计
原文件不保存累计高亮次数。只有 mutation/mutations 和 reptile/reptiles 各两条记录可确认并合并；其余不能推断实际高亮次数。
