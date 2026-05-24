export type LogCategory = "SEO" | "SEM";
export type LogType = "practice" | "news";

export type LogEntry = {
  id: string;
  title: string;
  category: LogCategory;
  type: LogType;
  publishedAt: string;
  sourceName: string;
  sourceUrl?: string;
  summary: string;
  mainContent: string;
  tags: string[];
};

export type CategoryFilter = "all" | LogCategory;
export type TypeFilter = "all" | LogType;
