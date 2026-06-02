import { useEffect, useMemo, useState } from "react";
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

function LogCard({ item, index }: { item: LogEntry; index?: number }) {
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
    const value = new URLSearchParams(window.location.search).get("date");
    return isValidDateKey(value) ? value : null;
  }, []);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthLogs, setMonthLogs] = useState<Record<string, LogEntry[] | null>>({});
  const [view, setView] = useState<"latest" | "archive">(initialDateFromUrl ? "archive" : "latest");
  const [selectedDate, setSelectedDate] = useState(initialDateFromUrl ?? defaultSelectedDate);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const monthsNeeded = useMemo(() => {
    const archiveMonth = monthFromDateKey(selectedDate);
    const latestBase = [currentMonth, prevMonth];
    const archiveBase = [archiveMonth, currentMonth, prevMonth];
    const base = view === "latest" ? latestBase : archiveBase;
    const months = Array.from(new Set(base));

    // 索引未就绪时只拉当前月，避免误请求不存在的上月 JSON（本地 dev 会回退 HTML）。
    if (availableMonths.length === 0) return [currentMonth];

    const matched = months.filter((month) => availableMonths.includes(month));
    if (matched.length > 0) return matched;

    // 当前月份区间无内容时，回退到最近有数据的月份，避免首页空白。
    return availableMonths.slice(0, view === "latest" ? 2 : 3);
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
    } else {
      params.delete("date");
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
      if (value && isValidDateKey(value)) {
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
      </div>

      <div className={view === "latest" ? "workspace latest-workspace" : "workspace"}>
        <FilterPanel
          onQuery={setQuery}
          query={query}
          resultCount={view === "latest" ? latestLogs.length : archiveLogs.length}
          suggestedTags={suggestedTags}
        />

        {view === "latest" ? (
          <DailyDigest items={latestLogs} latestUpdated={latestUpdated} />
        ) : (
          <Archive
            activeDate={archiveActiveDate}
            availableMonths={availableMonths}
            items={archiveLogs}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        )}
      </div>
      {isLoadingLogs && <p className="loading-note">正在加载更多归档内容…</p>}
      <SiteFooter />
    </main>
  );
}
