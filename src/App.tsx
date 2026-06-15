import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { LogEntry, LogType } from "./types";

const timeZone = "Asia/Shanghai";
const dayMs = 24 * 60 * 60 * 1000;
const logIndexUrl = `${import.meta.env.BASE_URL}data/logs/index.json`;

async function fetchMonthLogs(month: string): Promise<LogEntry[] | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/logs/${month}.json`);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) return null;
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as LogEntry[]) : null;
  } catch {
    return null;
  }
}

const adminDraftKey = "captain-logbook-admin-draft-v1";
const adminSessionKey = "captain-logbook-admin-session-v1";
const adminUsername = "外贸老船长";
const adminPassword = "jybspy19911022";

const typeLabels: Record<LogType, string> = {
  practice: "技术实操",
  news: "最新资讯",
};

const actionGroups = ["focus", "practice", "strategy", "routine"] as const;

type ActionGroup = (typeof actionGroups)[number];

type ActionRule = {
  group: ActionGroup;
  label: string;
  keywords: string[];
};

const actionTitles: Record<ActionGroup, string> = {
  focus: "核心关注",
  practice: "实操重点",
  strategy: "策略组合",
  routine: "日常执行",
};

const actionRules: ActionRule[] = [
  { group: "focus", label: "AI 搜索可见度与引用", keywords: ["AI Overviews", "AI Mode", "AI可见度", "AI 搜索", "ChatGPT", "Perplexity", "Gemini"] },
  { group: "focus", label: "Google 核心更新波动", keywords: ["Google核心更新", "核心更新", "Core Update", "rollout"] },
  { group: "focus", label: "B2B 独立站 GEO 转型", keywords: ["B2B独立站", "GEO", "生成式引擎"] },
  { group: "focus", label: "内容质量与可信信号", keywords: ["E-E-A-T", "内容质量", "people-first", "用户意图"] },
  { group: "focus", label: "高意图长尾与 BOFU 页面", keywords: ["BOFU", "长尾", "定价", "案例", "对比"] },
  { group: "focus", label: "多语言和区域页面表现", keywords: ["多语言", "hreflang", "本地化", "Geotargeting"] },
  { group: "focus", label: "改版架构对收录的影响", keywords: ["Headless", "Shopify", "BigCommerce", "改版", "域名"] },
  { group: "focus", label: "付费搜索高意图入口", keywords: ["SEM", "Google Ads", "品牌词", "高意图词"] },
  { group: "practice", label: "补齐 Schema 与结构化数据", keywords: ["Schema", "结构化数据", "FAQ", "HowTo", "Article"] },
  { group: "practice", label: "补强作者、案例和数据背书", keywords: ["E-E-A-T", "作者", "案例", "数据", "背书", "信任"] },
  { group: "practice", label: "优化 Topic Cluster 与支柱页", keywords: ["Topic Cluster", "Content Hubs", "支柱", "集群", "Pillar"] },
  { group: "practice", label: "精简表单和 CTA 转化路径", keywords: ["CTA", "表单", "预约", "转化", "ROI", "CRO"] },
  { group: "practice", label: "检查 hreflang 与区域落地页", keywords: ["hreflang", "国家", "语言", "本地关键词", "区域"] },
  { group: "practice", label: "做速度、移动体验和 URL 检查", keywords: ["Core Web Vitals", "加载", "移动友好", "URL", "性能"] },
  { group: "practice", label: "给产品页补规格和解决方案证据", keywords: ["产品规格", "解决方案", "白皮书", "选购指南"] },
  { group: "strategy", label: "用独立站沉淀品牌实体", keywords: ["独立站", "品牌实体", "实体", "私域询盘"] },
  { group: "strategy", label: "优先更新高价值 BOFU 页面", keywords: ["BOFU", "定价", "案例", "高价值", "询盘"] },
  { group: "strategy", label: "把 GEO 指标接入询盘归因", keywords: ["GEO", "AI可见度", "引用", "归因", "管道"] },
  { group: "strategy", label: "改版前规划 URL、重定向和性能", keywords: ["Headless", "改版", "域名", "重定向", "性能"] },
  { group: "strategy", label: "品牌词和交易意图词协同", keywords: ["SEM", "品牌词", "交易意图", "高意图词"] },
  { group: "routine", label: "对比 Search Console 展示、点击与 CTR", keywords: ["GSC", "Search Console", "展示", "点击", "CTR"] },
  { group: "routine", label: "记录 AI 平台品牌露出和引用页", keywords: ["ChatGPT", "Perplexity", "Gemini", "AI Overview", "引用"] },
  { group: "routine", label: "等更新稳定后复盘受影响页面", keywords: ["核心更新", "稳定", "波动", "受影响"] },
  { group: "routine", label: "按页面类型筛选优先级", keywords: ["页面类型", "核心产品页", "落地页", "集群页"] },
  { group: "routine", label: "检查改版相关重定向和 Schema", keywords: ["重定向", "Schema", "Headless", "域名"] },
  { group: "routine", label: "持续测试标题、CTA 和页面布局", keywords: ["A/B", "headline", "CTA", "布局", "热图"] },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(value instanceof Date ? value : new Date(value));
}

function formatShortDate(value: string | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    month: "long",
    day: "numeric",
  }).format(value instanceof Date ? value : new Date(value));
}

function dateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value instanceof Date ? value : new Date(value));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function monthKey(value: Date) {
  return dateKey(value).slice(0, 7);
}

function monthFromDateKey(value: string) {
  return value.slice(0, 7);
}

function getAvailableYears(months: string[]) {
  return Array.from(new Set(months.map((month) => month.slice(0, 4)))).sort((a, b) =>
    b.localeCompare(a, "en"),
  );
}

function getMonthsForYear(months: string[], year: string) {
  return months.filter((month) => month.startsWith(`${year}-`)).sort((a, b) => b.localeCompare(a, "en"));
}

function previousMonthKey(value: string) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1, 12));
  return monthKey(date);
}

function isValidDateKey(value: string | null) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function compareLogs(a: LogEntry, b: LogEntry) {
  const timeDiff = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  if (timeDiff !== 0) return timeDiff;
  if (a.type !== b.type) return a.type === "practice" ? -1 : 1;
  return a.title.localeCompare(b.title, "zh-CN");
}

function countByType(items: LogEntry[], logType: LogType) {
  return items.filter((item) => item.type === logType).length;
}

function countByCategory(items: LogEntry[], category: "SEO" | "SEM") {
  return items.filter((item) => item.category === category).length;
}

function countByKeyword(items: LogEntry[], keyword: string) {
  const lowerKeyword = keyword.toLowerCase();
  return items.filter((item) =>
    [item.title, item.summary, item.mainContent, ...item.tags].some((value) =>
      value.toLowerCase().includes(lowerKeyword),
    ),
  ).length;
}

function getDateRange(items: LogEntry[]) {
  if (items.length === 0) return "暂无匹配内容";
  const sortedTimes = items
    .map((item) => new Date(item.publishedAt).getTime())
    .sort((a, b) => a - b);
  const first = new Date(sortedTimes[0]);
  const last = new Date(sortedTimes[sortedTimes.length - 1]);
  const firstKey = dateKey(first);
  const lastKey = dateKey(last);

  return firstKey === lastKey
    ? formatShortDate(last)
    : `${formatShortDate(first)} - ${formatShortDate(last)}`;
}

function getTopTags(items: LogEntry[]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    item.tags.forEach((tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
    });
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, 5)
    .map(([tag]) => tag);
}

function getVisibleTags(items: LogEntry[]) {
  const seen = new Set<string>();
  const ordered: string[] = [];

  items.forEach((item) => {
    item.tags.forEach((tag) => {
      if (!seen.has(tag)) {
        seen.add(tag);
        ordered.push(tag);
      }
    });
  });

  return ordered;
}

function getOverview(items: LogEntry[]) {
  const aiCount = countByKeyword(items, "AI");
  const googleCount = countByKeyword(items, "Google");
  const semCount = countByCategory(items, "SEM");
  const topTags = getTopTags(items);

  return [
    {
      title: "AI 搜索能见度",
      metric: `${aiCount} 条`,
      text: aiCount > 0 ? "AEO/GEO、AI Overviews 与机器可读内容是今日主线。" : "当前筛选下 AI 相关内容较少。",
    },
    {
      title: "Google 变化",
      metric: `${googleCount} 条`,
      text: googleCount > 0 ? "核心更新、搜索路径与广告形态变化需要持续监测。" : "当前筛选下暂无明显 Google 主题。",
    },
    {
      title: semCount > 0 ? "投放策略" : "高频主题",
      metric: semCount > 0 ? `${semCount} 条` : `${topTags.length} 个`,
      text:
        semCount > 0
          ? "SEM 重点转向 AI 场景、商品信号和转化路径。"
          : topTags.length > 0
            ? topTags.slice(0, 3).join("、")
            : "等待更多日志形成趋势。",
    },
  ];
}

function getActionCorpus(items: LogEntry[]) {
  return items
    .map((item) => [item.title, item.summary, item.mainContent, item.sourceName, ...item.tags].join(" "))
    .join(" ")
    .toLowerCase();
}

function countKeywordMatches(corpus: string, keywords: string[]) {
  return keywords.reduce((count, keyword) => {
    return corpus.includes(keyword.toLowerCase()) ? count + 1 : count;
  }, 0);
}

function getFallbackActions(items: LogEntry[], group: ActionGroup) {
  const templates: Record<ActionGroup, (tag: string) => string> = {
    focus: (tag) => `关注 ${tag}`,
    practice: (tag) => `围绕 ${tag} 补充证据`,
    strategy: (tag) => `优先处理 ${tag} 相关页面`,
    routine: (tag) => `复盘 ${tag} 数据变化`,
  };

  return getTopTags(items).map(templates[group]);
}

function getDailyActionSections(items: LogEntry[]) {
  const corpus = getActionCorpus(items);
  const used = new Set<string>();

  return actionGroups.map((group) => {
    const matchedItems = actionRules
      .filter((rule) => rule.group === group)
      .map((rule) => ({
        label: rule.label,
        score: countKeywordMatches(corpus, rule.keywords),
      }))
      .filter((item) => item.score > 0 && !used.has(item.label))
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "zh-CN"))
      .map((item) => item.label);

    const sectionItems = [...matchedItems, ...getFallbackActions(items, group)]
      .filter((item) => {
        if (used.has(item)) return false;
        used.add(item);
        return true;
      })
      .slice(0, 3);

    return {
      title: actionTitles[group],
      items: sectionItems,
    };
  });
}

function splitAdvice(value: string) {
  return value
    .split(/[。；;]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function renderRichText(value: string) {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(value))) {
    const [full, label, url] = match;
    if (match.index > lastIndex) {
      nodes.push(<span key={`text-${lastIndex}`}>{value.slice(lastIndex, match.index)}</span>);
    }
    nodes.push(
      <a href={url} key={`link-${match.index}`} rel="noreferrer" target="_blank">
        {label}
      </a>,
    );
    lastIndex = match.index + full.length;
  }

  if (lastIndex < value.length) {
    nodes.push(<span key={`text-${lastIndex}`}>{value.slice(lastIndex)}</span>);
  }

  return nodes.length > 0 ? nodes : value;
}

function sortLogsDesc(items: LogEntry[]) {
  return [...items].sort(compareLogs);
}

function makeLogId(title: string, publishedAt: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const date = publishedAt.slice(0, 10);
  return `${slug || "log"}-${date}`;
}

function createEmptyLogEntry(publishedAt = "2026-06-15T09:00:00+08:00"): LogEntry {
  return {
    id: makeLogId("新日志", publishedAt),
    title: "",
    category: "SEO",
    type: "practice",
    publishedAt,
    sourceName: "",
    sourceUrl: "",
    summary: "",
    mainContent: "",
    tags: [],
  };
}

function splitPublishedAt(value: string) {
  const [date = "", timeWithZone = "09:00:00+08:00"] = value.split("T");
  const time = timeWithZone.slice(0, 5);
  return { date, time };
}

function combinePublishedAt(date: string, time: string) {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : "09:00:00";
  return `${date}T${normalizedTime}+08:00`;
}

function normalizeTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeLogEntry(value: unknown): LogEntry | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LogEntry>;
  const publishedAt =
    typeof candidate.publishedAt === "string" && candidate.publishedAt.trim().length > 0
      ? candidate.publishedAt
      : "2026-06-15T09:00:00+08:00";
  const title = typeof candidate.title === "string" ? candidate.title : "";
  return {
    id:
      typeof candidate.id === "string" && candidate.id.trim().length > 0
        ? candidate.id.trim()
        : makeLogId(title || "新日志", publishedAt),
    title,
    category: candidate.category === "SEM" ? "SEM" : "SEO",
    type: candidate.type === "news" ? "news" : "practice",
    publishedAt,
    sourceName: typeof candidate.sourceName === "string" ? candidate.sourceName : "",
    sourceUrl:
      typeof candidate.sourceUrl === "string" && candidate.sourceUrl.trim().length > 0
        ? candidate.sourceUrl
        : undefined,
    summary: typeof candidate.summary === "string" ? candidate.summary : "",
    mainContent: typeof candidate.mainContent === "string" ? candidate.mainContent : "",
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  };
}

function stringifyTags(tags: string[]) {
  return tags.join(", ");
}

function getAdminValidationIssues(item: LogEntry, allItems: LogEntry[]) {
  const issues: string[] = [];
  const trimmedFields = [
    ["id", item.id],
    ["title", item.title],
    ["sourceName", item.sourceName],
    ["summary", item.summary],
    ["mainContent", item.mainContent],
  ] as const;

  trimmedFields.forEach(([label, value]) => {
    if (!value.trim()) issues.push(`${label} 不能为空`);
  });

  if (!["SEO", "SEM"].includes(item.category)) issues.push("category 必须是 SEO 或 SEM");
  if (!["practice", "news"].includes(item.type)) issues.push("type 必须是 practice 或 news");
  if (Number.isNaN(new Date(item.publishedAt).getTime())) issues.push("publishedAt 不是合法时间");
  if (item.tags.some((tag) => !tag.trim())) issues.push("tags 里不能有空值");

  const duplicateCount = allItems.filter((other) => other.id === item.id).length;
  if (duplicateCount > 1) issues.push("id 不能重复");

  return issues;
}

function filterLogs(
  items: LogEntry[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return items
    .filter((item) => {
      if (!normalizedQuery) return true;
      const haystack = [
        item.title,
        item.summary,
        item.mainContent,
        item.sourceName,
        item.category,
        typeLabels[item.type],
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort(compareLogs);
}

function groupByDate(items: LogEntry[]) {
  return items.reduce<Record<string, LogEntry[]>>((groups, item) => {
    const key = dateKey(item.publishedAt);
    groups[key] = groups[key] ?? [];
    groups[key].push(item);
    return groups;
  }, {});
}

function getLatestDateKey(items: LogEntry[]) {
  if (items.length === 0) return null;
  return dateKey(items[0].publishedAt);
}

function getMonthDays(activeDate: Date, items: LogEntry[]) {
  const activeMonth = monthKey(activeDate);
  const [year, month] = activeMonth.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const last = new Date(Date.UTC(year, month, 0, 12));
  const totalDays = last.getUTCDate();
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const key = dateKey(item.publishedAt);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, index + 1, 12));
    const key = dateKey(date);
    return { key, label: String(index + 1), count: counts[key] ?? 0 };
  });
}

function FilterPanel({
  query,
  resultCount,
  suggestedTags,
  onQuery,
}: {
  query: string;
  resultCount: number;
  suggestedTags: string[];
  onQuery: (value: string) => void;
}) {
  const hasActiveFilters = query.trim().length > 0;
  const clearFilters = () => {
    onQuery("");
  };

  return (
    <aside className="filters" aria-label="内容筛选">
      <div className="filter-header">
        <div>
          <span className="filter-title">内容筛选</span>
          <p>{resultCount} 条匹配内容</p>
        </div>
        <button className="clear-filters" disabled={!hasActiveFilters} onClick={clearFilters} type="button">
          清除
        </button>
      </div>

      <div className="filter-controls">
        <label className="search-box">
          <span className="filter-label">关键词</span>
          <input
            onChange={(event) => onQuery(event.target.value)}
            placeholder="标签、来源、主题"
            type="search"
            value={query}
          />
        </label>

        {suggestedTags.length > 0 && (
          <div className="filter-block">
            <span className="filter-label">热门标签</span>
            <div className="quick-tags" aria-label="热门标签">
              {suggestedTags.map((tag) => (
                <button key={tag} onClick={() => onQuery(tag)} type="button">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function LogCard({ item, index, showMainContent = false }: { item: LogEntry; index?: number; showMainContent?: boolean }) {
  const advice = splitAdvice(item.mainContent);

  return (
    <article className={`log-card ${item.type}`}>
      <div className="card-meta">
        {typeof index === "number" && <span className="card-number">{index + 1}</span>}
        <span className="badge">{item.category}</span>
        <span className="badge muted">{typeLabels[item.type]}</span>
        <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt)}</time>
      </div>
      <h3>{item.title}</h3>
      <div className="brief-box">
        <span>{item.type === "practice" ? "实操观察" : "资讯要点"}</span>
        <p className="summary">{item.summary}</p>
      </div>
      {advice.length > 0 && (
        <div className="advice-list">
          <strong>实践建议</strong>
          <ul>
            {advice.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {showMainContent && item.mainContent && (
        <div className="content-block">
          <strong>正文</strong>
          <p className="content">{renderRichText(item.mainContent)}</p>
        </div>
      )}
      <div className="card-footer">
        {item.sourceUrl ? (
          <a href={item.sourceUrl} rel="noreferrer" target="_blank">
            查看原文：{item.sourceName}
          </a>
        ) : (
          <span>来源：{item.sourceName}</span>
        )}
        {item.tags.length > 0 && (
          <div className="tags" aria-label="标签">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function DigestHero({ items, latestUpdated }: { items: LogEntry[]; latestUpdated: number }) {
  const practiceCount = countByType(items, "practice");
  const newsCount = countByType(items, "news");
  const range = getDateRange(items);

  return (
    <header className="digest-hero">
      <div className="digest-copy">
        <p className="eyebrow">SEO / SEM Daily Briefing</p>
        <h1>SEO 与 SEM 最新技术实操资讯简报</h1>
        <p className="intro">{range}，精选高价值内容，聚焦搜索生态、AI 可见度和投放实战。</p>
        <div className="digest-pills" aria-label="简报统计">
          <span>{latestUpdated ? formatDate(new Date(latestUpdated)) : "暂无更新"}</span>
          <span>近 24 小时精选</span>
          <span>{items.length} 条高价值资讯</span>
        </div>
      </div>
      <div className="digest-stats" aria-label="内容构成">
        <div>
          <span>技术实操</span>
          <strong>{practiceCount}</strong>
        </div>
        <div>
          <span>行业资讯</span>
          <strong>{newsCount}</strong>
        </div>
      </div>
    </header>
  );
}

function CoreOverview({ items }: { items: LogEntry[] }) {
  const overview = getOverview(items);

  return (
    <section className="core-overview" aria-label="核心概览">
      <div className="overview-heading">
        <span>核心概览</span>
        <p>把当天信息先压缩成判断，再进入逐条细读。</p>
      </div>
      <div className="overview-grid">
        {overview.map((card) => (
          <article className="overview-card" key={card.title}>
            <strong>{card.title}</strong>
            <span>{card.metric}</span>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionPanel({ items }: { items: LogEntry[] }) {
  const sections = getDailyActionSections(items);

  return (
    <section className="action-panel" aria-label="行动建议">
      <div>
        <span className="section-kicker">行动建议</span>
        <h2>基于过去 24 小时资讯，今天可以先做这些检查</h2>
      </div>
      <div className="action-grid">
        {sections.map((section) => (
          <article className="action-card" key={section.title}>
            <strong>{section.title}</strong>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="action-note">当前视图共 {items.length} 条内容，以上建议已按当前资讯主题自动整理。</p>
    </section>
  );
}

function DailyDigest({ items, latestUpdated }: { items: LogEntry[]; latestUpdated: number }) {
  return (
    <section className="daily-digest" aria-label="过去 24 小时简报">
      <DigestHero items={items} latestUpdated={latestUpdated} />
      {items.length === 0 ? (
        <div className="empty-state">
          <h3>这片海域暂时风平浪静</h3>
          <p>当前筛选下没有匹配内容。可以换个频道、类型或关键词看看。</p>
        </div>
      ) : (
        <>
          <CoreOverview items={items} />
          <div className="section-heading digest-section-heading">
            <span>精选资讯</span>
            <strong>{items.length}</strong>
          </div>
          <div className="entries digest-grid">
            {items.map((item, index) => (
              <LogCard index={index} item={item} key={item.id} />
            ))}
          </div>
          <ActionPanel items={items} />
        </>
      )}
    </section>
  );
}

function Archive({
  activeDate,
  availableMonths,
  selectedDate,
  onSelectDate,
  items,
}: {
  activeDate: Date;
  availableMonths: string[];
  selectedDate: string;
  onSelectDate: (value: string) => void;
  items: LogEntry[];
}) {
  const selectedMonth = monthKey(activeDate);
  const selectedYear = selectedMonth.slice(0, 4);
  const selectableMonths = availableMonths.length > 0 ? availableMonths : [selectedMonth];
  const years = getAvailableYears(selectableMonths);
  const months = getMonthsForYear(selectableMonths, selectedYear);
  const monthItems = items.filter((item) => monthFromDateKey(dateKey(item.publishedAt)) === selectedMonth);
  const days = getMonthDays(activeDate, monthItems);
  const selectedItems = items.filter((item) => dateKey(item.publishedAt) === selectedDate);
  const handleYearChange = (value: string) => {
    const nextMonth = getMonthsForYear(selectableMonths, value)[0];
    if (nextMonth) onSelectDate(`${nextMonth}-01`);
  };
  const handleMonthChange = (value: string) => {
    onSelectDate(`${value}-01`);
  };

  return (
    <section className="archive" aria-label="归档日历">
      <div className="archive-toolbar">
        <div className="section-heading">
          <span>{selectedMonth} 归档</span>
          <strong>{monthItems.length}</strong>
        </div>
        <div className="archive-selectors" aria-label="归档筛选">
          <label>
            <span>年份</span>
            <select onChange={(event) => handleYearChange(event.target.value)} value={selectedYear}>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year} 年
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>月份</span>
            <select onChange={(event) => handleMonthChange(event.target.value)} value={selectedMonth}>
              {months.map((month) => (
                <option key={month} value={month}>
                  {Number(month.slice(5))} 月
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="calendar-grid">
        {days.map((day) => (
          <button
            className={day.key === selectedDate ? "calendar-day selected" : "calendar-day"}
            disabled={day.count === 0}
            key={day.key}
            onClick={() => onSelectDate(day.key)}
            type="button"
          >
            <span>{day.label}</span>
            <small>{day.count > 0 ? `${day.count} 条` : "无"}</small>
          </button>
        ))}
      </div>
      <div className="archive-list">
        <h3>{selectedDate} 航海记录</h3>
        {selectedItems.length === 0 ? (
          <p className="archive-empty">这一天还没有记录。</p>
        ) : (
          selectedItems.map((item) => <LogCard item={item} key={item.id} />)
        )}
      </div>
    </section>
  );
}

function downloadTextFile(filename: string, text: string, mimeType = "application/json") {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function LogAdmin({
  items,
  isReady,
  isAuthenticated,
  onAuthenticate,
  onLogout,
}: {
  items: LogEntry[];
  isReady: boolean;
  isAuthenticated: boolean;
  onAuthenticate: (username: string, password: string) => boolean;
  onLogout: () => void;
}) {
  const [draftLogs, setDraftLogs] = useState<LogEntry[] | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = window.localStorage.getItem(adminDraftKey);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as unknown;
      return Array.isArray(parsed)
        ? (parsed.map((item) => normalizeLogEntry(item)).filter((item): item is LogEntry => item !== null) as LogEntry[])
        : null;
    } catch {
      return null;
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState<string>("编辑内容会暂存到浏览器本地，不会直接同步到 GitHub。");
  const [isImporting, setIsImporting] = useState(false);
  const mainContentRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputId = "log-admin-import-input";

  useEffect(() => {
    if (draftLogs !== null) return;
    if (!isReady || items.length === 0) return;
    setDraftLogs(
      sortLogsDesc(items.map((item) => normalizeLogEntry(item)).filter((item): item is LogEntry => item !== null)),
    );
    setSelectedId(items[0]?.id ?? null);
  }, [draftLogs, isReady, items]);

  useEffect(() => {
    if (draftLogs === null || typeof window === "undefined") return;
    window.localStorage.setItem(adminDraftKey, JSON.stringify(draftLogs));
  }, [draftLogs]);

  useEffect(() => {
    if (selectedId) return;
    if (draftLogs && draftLogs.length > 0) {
      setSelectedId(draftLogs[0].id);
      return;
    }
    if (items.length > 0) setSelectedId(items[0].id);
  }, [draftLogs, items, selectedId]);

  const logs = draftLogs ?? [];
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return logs.filter((item) => {
      if (!normalizedQuery) return true;
      const haystack = [
        item.id,
        item.title,
        item.sourceName,
        item.summary,
        item.mainContent,
        item.tags.join(" "),
        item.publishedAt,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [logs, query]);
  const selectedItem = logs.find((item) => item.id === selectedId) ?? filteredLogs[0] ?? null;
  const selectedIssues = selectedItem ? getAdminValidationIssues(selectedItem, logs) : [];
  const totalTags = useMemo(() => new Set(logs.flatMap((item) => item.tags)).size, [logs]);
  const totalPublishedDays = useMemo(
    () => new Set(logs.map((item) => dateKey(item.publishedAt))).size,
    [logs],
  );

  useEffect(() => {
    if (!selectedItem) return;
    if (selectedId === selectedItem.id) return;
    setSelectedId(selectedItem.id);
  }, [selectedId, selectedItem]);

  function updateSelected(updater: (current: LogEntry) => LogEntry) {
    if (!selectedItem) return;
    setDraftLogs((current) => {
      const source = current ?? [];
      return sortLogsDesc(source.map((item) => (item.id === selectedItem.id ? updater(item) : item)));
    });
  }

  function insertMainContentLink() {
    const target = mainContentRef.current;
    if (!target || !selectedItem) return;

    const url = window.prompt("请输入链接 URL", "https://");
    if (!url) return;

    const selectionStart = target.selectionStart ?? selectedItem.mainContent.length;
    const selectionEnd = target.selectionEnd ?? selectionStart;
    const selectedText = selectedItem.mainContent.slice(selectionStart, selectionEnd).trim();
    const fallbackLabel = selectedText || "查看来源";
    const label = window.prompt("链接文字", fallbackLabel) || fallbackLabel;
    const insertText = `[${label}](${url})`;
    const nextValue =
      selectedItem.mainContent.slice(0, selectionStart) +
      insertText +
      selectedItem.mainContent.slice(selectionEnd);

    updateSelected((current) => ({ ...current, mainContent: nextValue }));
    setNotice("已插入 Markdown 链接。");
    window.setTimeout(() => {
      const nextCursor = selectionStart + insertText.length;
      target.focus();
      target.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  }

  function addNewLog() {
    const next = createEmptyLogEntry();
    setDraftLogs((current) => sortLogsDesc([next, ...(current ?? [])]));
    setSelectedId(next.id);
    setNotice("已创建新记录，继续填写即可。");
  }

  function duplicateLog() {
    if (!selectedItem) return;
    const nowParts = splitPublishedAt(selectedItem.publishedAt);
    const publishedAt = combinePublishedAt(nowParts.date, nowParts.time);
    const clone: LogEntry = {
      ...selectedItem,
      id: `${selectedItem.id}-copy`,
      title: `${selectedItem.title}（副本）`,
      publishedAt,
    };
    setDraftLogs((current) => sortLogsDesc([clone, ...(current ?? [])]));
    setSelectedId(clone.id);
    setNotice("已复制当前记录，可直接改成新条目。");
  }

  function removeLog() {
    if (!selectedItem) return;
    const confirmed = window.confirm(`确定删除「${selectedItem.title || selectedItem.id}」吗？`);
    if (!confirmed) return;
    setDraftLogs((current) => {
      const next = (current ?? []).filter((item) => item.id !== selectedItem.id);
      return next.length > 0 ? next : [createEmptyLogEntry()];
    });
    setSelectedId((current) => {
      const remaining = logs.filter((item) => item.id !== selectedItem.id);
      return remaining[0]?.id ?? null;
    });
    setNotice("已删除当前记录。");
  }

  function resetDraft() {
    const next = sortLogsDesc(items);
    setDraftLogs(next);
    setSelectedId(next[0]?.id ?? null);
    if (typeof window !== "undefined") window.localStorage.removeItem(adminDraftKey);
    setNotice("已恢复为线上数据快照。");
  }

  function exportLogs() {
    const payload = JSON.stringify(sortLogsDesc(draftLogs ?? []), null, 2);
    downloadTextFile("logs.json", `${payload}\n`);
    setNotice("已导出 logs.json。");
  }

  async function copyLogs() {
    const payload = JSON.stringify(sortLogsDesc(draftLogs ?? []), null, 2);
    await navigator.clipboard.writeText(`${payload}\n`);
    setNotice("已复制 JSON 到剪贴板。");
  }

  async function importLogs(file: File) {
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) throw new Error("导入文件必须是数组");
      const next = sortLogsDesc(
        parsed.map((item) => normalizeLogEntry(item)).filter((item): item is LogEntry => item !== null),
      );
      setDraftLogs(next);
      setSelectedId(next[0]?.id ?? null);
      setNotice("已导入新的日志数组。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败";
      setNotice(message);
    } finally {
      setIsImporting(false);
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = onAuthenticate(loginUsername, loginPassword);
    if (!ok) {
      setLoginError("账号或密码不正确。");
      return;
    }
    setLoginError("");
    setNotice("已登录后台。");
  }

  if (!isAuthenticated) {
    return (
      <section className="admin-panel" aria-label="日志后台登录">
        <div className="admin-hero">
          <div>
            <span className="section-kicker">日志后台</span>
            <h2>先登录再编辑</h2>
            <p>输入账号和密码后才能进入日志编辑器。</p>
          </div>
          <div className="admin-stats">
            <div>
              <span>状态</span>
              <strong>未登录</strong>
            </div>
            <div>
              <span>数据</span>
              <strong>{items.length}</strong>
            </div>
            <div>
              <span>权限</span>
              <strong>受限</strong>
            </div>
          </div>
        </div>

        <form className="admin-login-card" onSubmit={handleLogin}>
          <label>
            <span>账号</span>
            <input onChange={(event) => setLoginUsername(event.target.value)} value={loginUsername} />
          </label>
          <label>
            <span>密码</span>
            <input
              onChange={(event) => setLoginPassword(event.target.value)}
              type="password"
              value={loginPassword}
            />
          </label>
          <div className="admin-login-actions">
            <button type="submit">登录后台</button>
            <button
              onClick={() => {
                setLoginUsername("");
                setLoginPassword("");
                setLoginError("");
              }}
              type="button"
            >
              清空
            </button>
          </div>
          {loginError ? <p className="admin-login-error">{loginError}</p> : <p className="admin-login-hint">登录后会在本次浏览器会话中保持状态。</p>}
        </form>
      </section>
    );
  }

  if (!draftLogs && !isReady) {
    return (
      <section className="admin-panel" aria-label="日志后台">
        <div className="admin-hero">
          <span className="section-kicker">日志后台</span>
          <h2>正在装载可编辑数据</h2>
          <p>我们会先把月归档拉齐，再把编辑器打开，避免只看到半截数据。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-panel" aria-label="日志后台">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">日志后台</span>
          <h2>简单日志编辑器</h2>
          <p>先在这里编辑、预览、导出，再把 `src/data/logs.json` 回写到仓库。</p>
        </div>
        <div className="admin-stats">
          <div>
            <span>记录数</span>
            <strong>{logs.length}</strong>
          </div>
          <div>
            <span>覆盖天数</span>
            <strong>{totalPublishedDays}</strong>
          </div>
          <div>
            <span>标签数</span>
            <strong>{totalTags}</strong>
          </div>
        </div>
      </div>

      <div className="admin-toolbar">
        <label className="search-box admin-search">
          <span className="filter-label">搜索日志</span>
          <input onChange={(event) => setQuery(event.target.value)} placeholder="标题、ID、来源、标签" type="search" value={query} />
        </label>
        <div className="admin-actions">
          <button onClick={onLogout} type="button">退出登录</button>
          <button onClick={addNewLog} type="button">新建</button>
          <button onClick={duplicateLog} type="button" disabled={!selectedItem}>复制</button>
          <button onClick={removeLog} type="button" disabled={!selectedItem}>删除</button>
          <button onClick={resetDraft} type="button">恢复线上</button>
          <button onClick={copyLogs} type="button" disabled={logs.length === 0}>复制 JSON</button>
          <button onClick={exportLogs} type="button" disabled={logs.length === 0}>导出文件</button>
          <label className="import-button" htmlFor={fileInputId}>
            {isImporting ? "导入中…" : "导入 JSON"}
          </label>
          <input
            accept="application/json"
            aria-label="导入 JSON"
            className="sr-only"
            disabled={isImporting}
            id={fileInputId}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importLogs(file);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </div>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-heading">
            <strong>日志列表</strong>
            <span>{filteredLogs.length} 条</span>
          </div>
          <div className="admin-list">
            {filteredLogs.map((item) => (
              <button
                className={item.id === selectedItem?.id ? "admin-list-item active" : "admin-list-item"}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span>{item.title || "未命名记录"}</span>
                <small>{item.publishedAt.slice(0, 10)} · {item.category} · {item.type}</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="admin-editor-shell">
          {selectedItem ? (
            <>
              <div className="admin-form-grid">
                <label>
                  <span>ID</span>
                  <input
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setSelectedId(nextId);
                      updateSelected((current) => ({ ...current, id: nextId }));
                    }}
                    value={selectedItem.id}
                  />
                </label>
                <label>
                  <span>标题</span>
                  <input
                    onChange={(event) => updateSelected((current) => ({ ...current, title: event.target.value }))}
                    value={selectedItem.title}
                  />
                </label>
                <label>
                  <span>分类</span>
                  <select
                    onChange={(event) => updateSelected((current) => ({ ...current, category: event.target.value as "SEO" | "SEM" }))}
                    value={selectedItem.category}
                  >
                    <option value="SEO">SEO</option>
                    <option value="SEM">SEM</option>
                  </select>
                </label>
                <label>
                  <span>类型</span>
                  <select
                    onChange={(event) => updateSelected((current) => ({ ...current, type: event.target.value as LogType }))}
                    value={selectedItem.type}
                  >
                    <option value="practice">practice</option>
                    <option value="news">news</option>
                  </select>
                </label>
                <label>
                  <span>日期</span>
                  <input
                    onChange={(event) => {
                      const { time } = splitPublishedAt(selectedItem.publishedAt);
                      updateSelected((current) => ({ ...current, publishedAt: combinePublishedAt(event.target.value, time) }));
                    }}
                    type="date"
                    value={splitPublishedAt(selectedItem.publishedAt).date}
                  />
                </label>
                <label>
                  <span>时间</span>
                  <div className="time-inline">
                    <input
                      onChange={(event) => {
                        const { date } = splitPublishedAt(selectedItem.publishedAt);
                        updateSelected((current) => ({ ...current, publishedAt: combinePublishedAt(date, event.target.value) }));
                      }}
                      type="time"
                      value={splitPublishedAt(selectedItem.publishedAt).time}
                    />
                    <span>+08:00</span>
                  </div>
                </label>
                <label className="span-2">
                  <span>来源名称</span>
                  <input
                    onChange={(event) => updateSelected((current) => ({ ...current, sourceName: event.target.value }))}
                    value={selectedItem.sourceName}
                  />
                </label>
                <label className="span-2">
                  <span>来源链接</span>
                  <input
                    onChange={(event) => updateSelected((current) => ({ ...current, sourceUrl: event.target.value }))}
                    placeholder="可留空"
                    value={selectedItem.sourceUrl ?? ""}
                  />
                </label>
                <label className="span-2">
                  <span>摘要</span>
                  <textarea
                    onChange={(event) => updateSelected((current) => ({ ...current, summary: event.target.value }))}
                    rows={3}
                    value={selectedItem.summary}
                  />
                </label>
                <label className="span-2">
                  <span>正文</span>
                  <div className="editor-field-actions">
                    <button onClick={insertMainContentLink} type="button">插入链接</button>
                    <span>支持 Markdown 链接：`[文字](https://...)`</span>
                  </div>
                  <textarea
                    ref={mainContentRef}
                    onChange={(event) => updateSelected((current) => ({ ...current, mainContent: event.target.value }))}
                    rows={8}
                    value={selectedItem.mainContent}
                  />
                </label>
                <label className="span-2">
                  <span>标签</span>
                  <textarea
                    onChange={(event) => updateSelected((current) => ({ ...current, tags: normalizeTags(event.target.value) }))}
                    rows={2}
                    value={stringifyTags(selectedItem.tags)}
                  />
                </label>
              </div>

              <div className="admin-feedback">
                <div>
                  <strong>状态</strong>
                  <p>{notice}</p>
                </div>
                <div>
                  <strong>校验</strong>
                  <ul>
                    {selectedIssues.length > 0 ? (
                      selectedIssues.map((issue) => <li key={issue}>{issue}</li>)
                    ) : (
                      <li>当前条目看起来没有明显结构问题。</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="admin-preview">
                <div className="section-heading">
                  <span>预览</span>
                  <strong>{selectedItem.category}</strong>
                </div>
                <LogCard item={selectedItem} showMainContent />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>还没有可编辑的记录</h3>
              <p>可以先导入 JSON，或者新建一条空白记录开始。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>SEO与SEM最新技术实操资讯简报</p>
      <p>本简报精选自主流搜索营销站点、Google官方更新及行业讨论</p>
      <p>
        由{" "}
        <a href="https://www.ytcaptain.com/" rel="noreferrer" target="_blank">
          外贸老船长
        </a>{" "}
        技术驱动
      </p>
    </footer>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const now = useMemo(() => new Date(), []);
  const latestCutoff = now.getTime() - dayMs;
  const currentMonth = useMemo(() => monthKey(now), [now]);
  const prevMonth = useMemo(() => previousMonthKey(currentMonth), [currentMonth]);
  const defaultSelectedDate = dateKey(now);
  const initialDateFromUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "admin") return "admin";
    const value = params.get("date");
    return isValidDateKey(value) ? value : null;
  }, []);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthLogs, setMonthLogs] = useState<Record<string, LogEntry[] | null>>({});
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(adminSessionKey) === "1";
  });
  const [view, setView] = useState<"latest" | "archive" | "admin">(
    initialDateFromUrl === "admin" ? "admin" : initialDateFromUrl ? "archive" : "latest",
  );
  const [selectedDate, setSelectedDate] = useState(initialDateFromUrl === "admin" ? defaultSelectedDate : initialDateFromUrl ?? defaultSelectedDate);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const monthsNeeded = useMemo(() => {
    const archiveMonth = monthFromDateKey(selectedDate);
    const latestBase = [currentMonth, prevMonth];
    const archiveBase = [archiveMonth];
    const adminBase = availableMonths.length > 0 ? availableMonths : [currentMonth];
    const base = view === "latest" ? latestBase : view === "archive" ? archiveBase : adminBase;
    const months = Array.from(new Set(base));

    // 索引未就绪时只拉当前月，避免误请求不存在的上月 JSON（本地 dev 会回退 HTML）。
    if (availableMonths.length === 0) {
      return view === "latest" ? [currentMonth] : [archiveMonth];
    }

    const matched = months.filter((month) => availableMonths.includes(month));
    if (matched.length > 0) return matched;

    if (view === "latest") {
      // 当前月份区间无内容时，回退到最近有数据的月份，避免首页空白。
      return availableMonths.slice(0, 2);
    }

    if (view === "archive") {
      // 归档页保持单月请求，避免为了兜底把其它月份也拉下来。
      return [archiveMonth];
    }

    // 后台页优先把所有可用月份都拉齐，方便编辑完整数据。
    return availableMonths;
  }, [availableMonths, currentMonth, prevMonth, selectedDate, view]);

  const scopedLogs = useMemo(
    () =>
      monthsNeeded
        .flatMap((month) => monthLogs[month] ?? [])
        .sort(compareLogs),
    [monthLogs, monthsNeeded],
  );

  const latestUpdated = scopedLogs.reduce((latest, item) => {
    const itemTime = new Date(item.publishedAt).getTime();
    return itemTime > latest ? itemTime : latest;
  }, 0);
  const effectiveLatestCutoff =
    latestUpdated > 0 && latestUpdated < latestCutoff ? latestUpdated - dayMs : latestCutoff;

  const latestLogs = useMemo(
    () =>
      filterLogs(
        scopedLogs.filter((item) => new Date(item.publishedAt).getTime() >= effectiveLatestCutoff),
        query,
      ),
    [effectiveLatestCutoff, query, scopedLogs],
  );

  const archiveLogs = useMemo(
    () => filterLogs(scopedLogs, query),
    [query, scopedLogs],
  );
  const suggestedTags = useMemo(
    () => getVisibleTags(view === "latest" ? latestLogs : archiveLogs),
    [archiveLogs, latestLogs, view],
  );
  const archiveActiveDate = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }, [selectedDate]);
  const adminReady = useMemo(
    () => monthsNeeded.every((month) => monthLogs[month] !== undefined),
    [monthLogs, monthsNeeded],
  );

  function authenticateAdmin(username: string, password: string) {
    const ok = username === adminUsername && password === adminPassword;
    if (!ok) return false;
    setAdminAuthenticated(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(adminSessionKey, "1");
    }
    setView("admin");
    return true;
  }

  function logoutAdmin() {
    setAdminAuthenticated(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(adminSessionKey);
    }
    setView("latest");
  }

  useEffect(() => {
    let cancelled = false;
    const loadIndex = async () => {
      try {
        const res = await fetch(logIndexUrl);
        if (!res.ok) throw new Error(`failed to load log index (${res.status})`);
        const payload = (await res.json()) as { months?: string[] };
        const months = (payload.months ?? []).filter((month) => /^\d{4}-\d{2}$/.test(month));
        if (!cancelled) setAvailableMonths(months);
      } catch {
        if (!cancelled) setAvailableMonths([currentMonth]);
      }
    };
    loadIndex();
    return () => {
      cancelled = true;
    };
  }, [currentMonth, prevMonth]);

  useEffect(() => {
    if (availableMonths.length === 0) return;
    setMonthLogs((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const month of availableMonths) {
        if (next[month] === null) {
          delete next[month];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [availableMonths]);

  useEffect(() => {
    const missingMonths = monthsNeeded.filter((month) => monthLogs[month] === undefined);
    if (missingMonths.length === 0) return;
    let cancelled = false;
    setIsLoadingLogs(true);

    Promise.allSettled(missingMonths.map((month) => fetchMonthLogs(month)))
      .then((results) => {
        if (cancelled) return;
        setMonthLogs((prev) => {
          const next = { ...prev };
          results.forEach((result, index) => {
            const month = missingMonths[index];
            if (result.status === "fulfilled" && result.value) {
              next[month] = result.value;
              return;
            }
            // 失败记为 null（非空数组），避免阻塞其它月份且不与“未加载”混淆。
            next[month] = null;
          });
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLogs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [monthLogs, monthsNeeded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (view === "archive") {
      params.set("date", selectedDate);
      params.delete("mode");
    } else if (view === "admin") {
      params.set("mode", "admin");
      params.delete("date");
    } else {
      params.delete("date");
      params.delete("mode");
    }
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", next);
  }, [selectedDate, view]);

  useEffect(() => {
    if (view !== "archive") return;
    if (archiveLogs.length === 0) return;
    const selectedMonth = monthFromDateKey(selectedDate);
    const monthLogs = archiveLogs.filter((item) => monthFromDateKey(dateKey(item.publishedAt)) === selectedMonth);
    if (monthLogs.length === 0) return;
    const hasSelected = monthLogs.some((item) => dateKey(item.publishedAt) === selectedDate);
    if (hasSelected) return;
    const fallbackDate = getLatestDateKey(monthLogs);
    if (fallbackDate) setSelectedDate(fallbackDate);
  }, [archiveLogs, selectedDate, view]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const value = new URLSearchParams(window.location.search).get("date");
      const mode = new URLSearchParams(window.location.search).get("mode");
      if (mode === "admin") {
        setView("admin");
      } else if (value && isValidDateKey(value)) {
        setSelectedDate(value);
        setView("archive");
      } else {
        setView("latest");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <main>
      <header className="masthead site-header">
        <div className="logo-lockup">
          <img src="logo.png" alt="外贸老船长" />
        </div>
        <div>
          <p className="eyebrow">SEO / SEM Daily Logbook</p>
          <h1>老船长航海日志</h1>
          <p className="intro">近 24 小时技术实操、投放复盘和搜索营销资讯，一页读完。</p>
        </div>
        <div className="updated-card">
          <span>最近更新</span>
          <strong>{latestUpdated ? formatDateTime(new Date(latestUpdated).toISOString()) : "暂无"}</strong>
        </div>
      </header>

      <div className="view-tabs" aria-label="视图切换">
        <button
          className={view === "latest" ? "active" : ""}
          onClick={() => setView("latest")}
          type="button"
        >
          近 24 小时
        </button>
        <button
          className={view === "archive" ? "active" : ""}
          onClick={() => setView("archive")}
          type="button"
        >
          归档日历
        </button>
        <button
          className={view === "admin" ? "active" : ""}
          onClick={() => setView("admin")}
          type="button"
        >
          日志后台
        </button>
      </div>

      <div className={view === "admin" ? "workspace admin-workspace" : view === "latest" ? "workspace latest-workspace" : "workspace"}>
        {view !== "admin" && (
          <FilterPanel
            onQuery={setQuery}
            query={query}
            resultCount={view === "latest" ? latestLogs.length : archiveLogs.length}
            suggestedTags={suggestedTags}
          />
        )}

        {view === "latest" ? (
          <DailyDigest items={latestLogs} latestUpdated={latestUpdated} />
        ) : view === "archive" ? (
          <Archive
            activeDate={archiveActiveDate}
            availableMonths={availableMonths}
            items={archiveLogs}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        ) : (
          <LogAdmin
            isAuthenticated={adminAuthenticated}
            isReady={adminReady}
            items={sortLogsDesc(scopedLogs)}
            onAuthenticate={authenticateAdmin}
            onLogout={logoutAdmin}
          />
        )}
      </div>
      {isLoadingLogs && <p className="loading-note">正在加载更多归档内容…</p>}
      <SiteFooter />
    </main>
  );
}
