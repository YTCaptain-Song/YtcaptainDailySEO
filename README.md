# 老船长航海日志

一个用于展示近 24 小时 SEO / SEM 技术实操与最新资讯的静态日历网站。

## 内容维护

所有内容维护在 `src/data/logs.json`。新增记录时保持下面字段：

```json
{
  "id": "seo-example-2026-05-24",
  "title": "标题",
  "category": "SEO",
  "type": "practice",
  "publishedAt": "2026-05-24T09:30:00+08:00",
  "sourceName": "来源名称",
  "sourceUrl": "https://example.com",
  "summary": "一句话摘要",
  "mainContent": "主要内容",
  "tags": ["标签"]
}
```

- `category` 只能是 `SEO` 或 `SEM`。
- `type` 只能是 `practice` 或 `news`。
- `sourceUrl` 可以省略。
- `tags` 可以是空数组。
- 首页会自动展示当前时间往前 24 小时内的记录，其他记录进入归档日历。

## 本地预览

```bash
npm install
npm run dev
```

## 校验和构建

```bash
npm run validate
npm run build
```

构建产物会生成在 `dist/`，可部署到 Netlify 或 Vercel。

## GitHub Pages

项目已包含 `.github/workflows/deploy-pages.yml`。推送到 GitHub 仓库的 `main` 分支后，到仓库的 `Settings > Pages` 把发布来源设置为 `GitHub Actions`，Actions 跑完后即可看到 Pages 预览链接。
