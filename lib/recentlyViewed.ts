export interface RecentBook {
  sysNo: string;
  title: string;
  authors: string[];
  year?: string;
  viewedAt: number;
}

const KEY = 'library_recently_viewed_v1';
const MAX = 20;

export function getRecentlyViewed(): RecentBook[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addToRecentlyViewed(book: Omit<RecentBook, 'viewedAt'>): void {
  const list = getRecentlyViewed().filter((b) => b.sysNo !== book.sysNo);
  list.unshift({ ...book, viewedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function clearRecentlyViewed(): void {
  localStorage.removeItem(KEY);
}
