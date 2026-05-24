import { useMemo, useState } from "react";
import rawLogs from "./data/logs.json";
import type { CategoryFilter, LogEntry, LogType, TypeFilter } from "./types";

const logs = rawLogs as LogEntry[];
const timeZone = "Asia/Shanghai";
const dayMs = 24 * 60 * 60 * 1000;

const typeLabels: Record<LogType, string> = {
  practice: "技术实操",
  news: "最新资讯",
};

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

function compareLogs(a: LogEntry, b: LogEntry) {
  const timeDiff = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  if (timeDiff !== 0) return timeDiff;
  if (a.type !== b.type) return a.type === "practice" ? -1 : 1;
  return a.title.localeCompare(b.title, "zh-CN");
}

function filterLogs(
  items: LogEntry[],
  category: CategoryFilter,
  type: TypeFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return items
    .filter((item) => category === "all" || item.category === category)
    .filter((item) => type === "all" || item.type === type)
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
  category,
  type,
  query,
  onCategory,
  onType,
  onQuery,
}: {
  category: CategoryFilter;
  type: TypeFilter;
  query: string;
  onCategory: (value: CategoryFilter) => void;
  onType: (value: TypeFilter) => void;
  onQuery: (value: string) => void;
}) {
  return (
    <aside className="filters" aria-label="内容筛选">
      <div className="filter-block">
        <span className="filter-label">频道</span>
        <div className="segmented">
          {[
            ["all", "全部"],
            ["SEO", "SEO"],
            ["SEM", "SEM"],
          ].map(([value, label]) => (
            <button
              className={category === value ? "active" : ""}
              key={value}
              onClick={() => onCategory(value as CategoryFilter)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-block">
        <span className="filter-label">类型</span>
        <div className="segmented vertical">
          {[
            ["all", "全部内容"],
            ["practice", "技术实操"],
            ["news", "最新资讯"],
          ].map(([value, label]) => (
            <button
              className={type === value ? "active" : ""}
              key={value}
              onClick={() => onType(value as TypeFilter)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="search-box">
        <span className="filter-label">关键词</span>
        <input
          onChange={(event) => onQuery(event.target.value)}
          placeholder="标签、来源、主题"
          type="search"
          value={query}
        />
      </label>
    </aside>
  );
}

function LogCard({ item }: { item: LogEntry }) {
  return (
    <article className={`log-card ${item.type}`}>
      <div className="card-meta">
        <span className="badge">{item.category}</span>
        <span className="badge muted">{typeLabels[item.type]}</span>
        <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt)}</time>
      </div>
      <h3>{item.title}</h3>
      <p className="summary">{item.summary}</p>
      <p className="content">{item.mainContent}</p>
      <div className="card-footer">
        {item.sourceUrl ? (
          <a href={item.sourceUrl} rel="noreferrer" target="_blank">
            来源：{item.sourceName}
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

function Timeline({ title, items }: { title: string; items: LogEntry[] }) {
  const groups = groupByDate(items);
  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <section className="timeline" aria-label={title}>
      <div className="section-heading">
        <span>{title}</span>
        <strong>{items.length}</strong>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          <h3>这片海域暂时风平浪静</h3>
          <p>当前筛选下没有匹配内容。可以换个频道、类型或关键词看看。</p>
        </div>
      ) : (
        keys.map((key) => (
          <div className="date-group" key={key}>
            <h2>{formatDate(new Date(`${key}T12:00:00+08:00`))}</h2>
            <div className="entries">
              {groups[key].map((item) => (
                <LogCard item={item} key={item.id} />
              ))}
            </div>
          </div>
        ))
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

export default function App() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"latest" | "archive">("latest");
  const now = useMemo(() => new Date(), []);
  const latestCutoff = now.getTime() - dayMs;
  const latestUpdated = logs.reduce((latest, item) => {
    const itemTime = new Date(item.publishedAt).getTime();
    return itemTime > latest ? itemTime : latest;
  }, 0);
  const defaultSelectedDate = dateKey(new Date(latestUpdated || now.getTime()));
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);

  const latestLogs = useMemo(
    () =>
      filterLogs(
        logs.filter((item) => new Date(item.publishedAt).getTime() >= latestCutoff),
        category,
        type,
        query,
      ),
    [category, latestCutoff, query, type],
  );

  const archiveLogs = useMemo(
    () => filterLogs(logs, category, type, query),
    [category, query, type],
  );

  return (
    <main>
      <header className="masthead">
        <div className="logo-lockup">
          <img src="/logo.png" alt="外贸老船长" />
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

      <div className="workspace">
        <FilterPanel
          category={category}
          onCategory={setCategory}
          onQuery={setQuery}
          onType={setType}
          query={query}
          type={type}
        />

        {view === "latest" ? (
          <Timeline items={latestLogs} title="过去 24 小时" />
        ) : (
          <Archive
            activeDate={now}
            items={archiveLogs}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </main>
  );
}
