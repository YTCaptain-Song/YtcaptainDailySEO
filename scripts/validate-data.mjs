import fs from "node:fs";

const file = new URL("../src/data/logs.json", import.meta.url);
const logs = JSON.parse(fs.readFileSync(file, "utf8"));
const categories = new Set(["SEO", "SEM"]);
const types = new Set(["practice", "news"]);
const ids = new Set();

for (const item of logs) {
  const required = [
    "id",
    "title",
    "category",
    "type",
    "publishedAt",
    "sourceName",
    "summary",
    "mainContent",
    "tags",
  ];

  for (const field of required) {
    if (!(field in item)) {
      throw new Error(`${item.id ?? "unknown"} 缺少字段 ${field}`);
    }
  }

  if (ids.has(item.id)) {
    throw new Error(`重复 id: ${item.id}`);
  }

  ids.add(item.id);

  if (!categories.has(item.category)) {
    throw new Error(`${item.id} 的 category 必须是 SEO 或 SEM`);
  }

  if (!types.has(item.type)) {
    throw new Error(`${item.id} 的 type 必须是 practice 或 news`);
  }

  if (Number.isNaN(new Date(item.publishedAt).getTime())) {
    throw new Error(`${item.id} 的 publishedAt 不是合法时间`);
  }

  if (!Array.isArray(item.tags)) {
    throw new Error(`${item.id} 的 tags 必须是数组`);
  }
}

console.log(`内容数据校验通过：${logs.length} 条记录`);
