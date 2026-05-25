import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "src", "data", "logs.json");
const targetDir = path.join(rootDir, "public", "data", "logs");
const indexPath = path.join(targetDir, "index.json");

function extractMonth(value) {
  return value.slice(0, 7);
}

function sortByPublishedAtDesc(a, b) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
}

async function main() {
  const raw = await readFile(sourcePath, "utf8");
  const logs = JSON.parse(raw);

  if (!Array.isArray(logs)) {
    throw new Error("src/data/logs.json 必须是数组");
  }

  const grouped = new Map();
  for (const item of logs) {
    if (!item?.publishedAt || typeof item.publishedAt !== "string") {
      throw new Error(`存在缺少 publishedAt 的记录: ${item?.id ?? "unknown"}`);
    }
    const month = extractMonth(item.publishedAt);
    const bucket = grouped.get(month) ?? [];
    bucket.push(item);
    grouped.set(month, bucket);
  }

  const months = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a, "en"));
  await mkdir(targetDir, { recursive: true });

  for (const month of months) {
    const monthLogs = grouped.get(month).sort(sortByPublishedAtDesc);
    const monthPath = path.join(targetDir, `${month}.json`);
    await writeFile(monthPath, `${JSON.stringify(monthLogs, null, 2)}\n`, "utf8");
  }

  const indexPayload = { months };
  await writeFile(indexPath, `${JSON.stringify(indexPayload, null, 2)}\n`, "utf8");

  console.log(`已生成 ${months.length} 个月份文件`);
  console.log(`月份列表: ${months.join(", ")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
