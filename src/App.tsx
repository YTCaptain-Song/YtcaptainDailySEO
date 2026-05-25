import { useEffect, useMemo, useState } from "react";
import type { LogEntry, LogType } from "./types";

const timeZone = "Asia/Shanghai";
const dayMs = 24 * 60 * 60 * 1000;
const logIndexUrl = `${import.meta.env.BASE_URL}data/logs/index.json`;

const typeLabels: Record<LogType, string> = {
  practice: "技术实操",
  news: "最新资讯",
};

const actionSections = [
  {
    title: "核心关注",
    items: ["AI 搜索可见度", "Google 核心更新", "内容质量与用户意图"],
  },
  {
    title: "实操重点",
    items: ["强化 E-E-A-T", "补充结构化数据", "监测 AI Overviews 引用"],
  },
  {
    title: "策略组合",
    items: ["SEO 与 SEM 协同", "品牌实体枢纽", "高价值页面优先"],
  },
  {
    title: "日常执行",
    items: ["检查 Search Console", "记录排名和点击波动", "持续更新重点页面"],
  },
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

function ActionPanel({ total }: { total: number }) {
  return (
    <section className="action-panel" aria-label="行动建议">
      <div>
        <span className="section-kicker">行动建议</span>
        <h2>基于过去 24 小时资讯，今天可以先做这些检查</h2>
      </div>
      <div className="action-grid">
        {actionSections.map((section) => (
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
      <p className="action-note">当前视图共 {total} 条内容，筛选后可作为今日 SEO / SEM 工作清单的输入。</p>
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
          <ActionPanel total={items.length} />
        </>
      )}
    </section>
  );
}

function Archive({
  activeDate,
  selectedDate,
  onSelectDate,
  items,
}: {
  activeDate: Date;
  selectedDate: string;
  onSelectDate: (value: string) => void;
  items: LogEntry[];
}) {
  const days = getMonthDays(activeDate, items);
  const selectedItems = items.filter((item) => dateKey(item.publishedAt) === selectedDate);

  return (
    <section className="archive" aria-label="归档日历">
      <div className="section-heading">
        <span>{monthKey(activeDate)} 归档</span>
        <strong>{items.length}</strong>
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
  const [monthLogs, setMonthLogs] = useState<Record<string, LogEntry[]>>({});
  const [view, setView] = useState<"latest" | "archive">(initialDateFromUrl ? "archive" : "latest");
  const [selectedDate, setSelectedDate] = useState(initialDateFromUrl ?? defaultSelectedDate);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const monthsNeeded = useMemo(() => {
    const archiveMonth = monthFromDateKey(selectedDate);
    const latestBase = [currentMonth, prevMonth];
    const archiveBase = [archiveMonth, currentMonth, prevMonth];
    const base = view === "latest" ? latestBase : archiveBase;
    const months = Array.from(new Set(base));

    if (availableMonths.length === 0) return months;

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
        if (!cancelled) setAvailableMonths([currentMonth, prevMonth]);
      }
    };
    loadIndex();
    return () => {
      cancelled = true;
    };
  }, [currentMonth, prevMonth]);

  useEffect(() => {
    const missingMonths = monthsNeeded.filter((month) => monthLogs[month] === undefined);
    if (missingMonths.length === 0) return;
    let cancelled = false;
    setIsLoadingLogs(true);

    Promise.all(
      missingMonths.map(async (month) => {
        const res = await fetch(`${import.meta.env.BASE_URL}data/logs/${month}.json`);
        if (!res.ok) throw new Error(`failed to load month ${month} (${res.status})`);
        const data = (await res.json()) as LogEntry[];
        return [month, data] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setMonthLogs((prev) => {
          const next = { ...prev };
          entries.forEach(([month, logs]) => {
            next[month] = logs;
          });
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setMonthLogs((prev) => {
            const next = { ...prev };
            missingMonths.forEach((month) => {
              next[month] = [];
            });
            return next;
          });
        }
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
    const hasSelected = archiveLogs.some((item) => dateKey(item.publishedAt) === selectedDate);
    if (hasSelected) return;
    const fallbackDate = getLatestDateKey(archiveLogs);
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
