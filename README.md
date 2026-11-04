# 拾词：GitHub Pages 版

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
保存在当前浏览器。手机与公司电脑不自动同步，可使用导出／导入迁移。同域下不同路径的网站可能共用当前存储键 shici-progress-v1。
换域名后，原 ChatGPT Sites 进度也不会自动带过来：先在原网站导出，再在这里导入。
网站和词库公开，学习进度不上传。GitHub Pages 不提供学习记录数据库。
朗读依赖浏览器设备语音能力。公司是否能访问 github.io 需在公司网络实际验证。

## 词汇统计
原文件不保存累计高亮次数。只有 mutation/mutations 和 reptile/reptiles 各两条记录可确认并合并；其余不能推断实际高亮次数。
