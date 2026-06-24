export interface WindowRangeOptions {
  total: number;
  scrollTop: number;
  rowHeight: number;
  viewportHeight: number;
  threshold: number;
  overscan?: number;
}

export interface WindowRange {
  start: number;
  end: number;
  beforeHeight: number;
  afterHeight: number;
  totalHeight: number;
  visibleCount: number;
  isWindowed: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safePositiveInteger(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function getWindowRange({
  total,
  scrollTop,
  rowHeight,
  viewportHeight,
  threshold,
  overscan = 4,
}: WindowRangeOptions): WindowRange {
  const safeTotal = safePositiveInteger(total, 0);
  const safeRowHeight = safePositiveInteger(rowHeight, 1);
  const safeViewportHeight = safePositiveInteger(viewportHeight, safeRowHeight);
  const safeThreshold = safePositiveInteger(threshold, 0);
  const safeOverscan = safePositiveInteger(overscan, 0);
  const totalHeight = safeTotal * safeRowHeight;

  if (safeTotal <= safeThreshold) {
    return {
      start: 0,
      end: safeTotal,
      beforeHeight: 0,
      afterHeight: 0,
      totalHeight,
      visibleCount: safeTotal,
      isWindowed: false,
    };
  }

  const maxScrollTop = Math.max(0, totalHeight - safeViewportHeight);
  const normalizedScrollTop = clamp(scrollTop, 0, maxScrollTop);
  const firstVisible = Math.floor(normalizedScrollTop / safeRowHeight);
  const visibleRows = Math.ceil(safeViewportHeight / safeRowHeight);
  const start = clamp(firstVisible - safeOverscan, 0, safeTotal);
  const end = clamp(firstVisible + visibleRows + safeOverscan, start, safeTotal);

  return {
    start,
    end,
    beforeHeight: start * safeRowHeight,
    afterHeight: Math.max(0, (safeTotal - end) * safeRowHeight),
    totalHeight,
    visibleCount: end - start,
    isWindowed: true,
  };
}

export function sliceWindow<T>(items: T[], range: WindowRange): T[] {
  return range.isWindowed ? items.slice(range.start, range.end) : items;
}
