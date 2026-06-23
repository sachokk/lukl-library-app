'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, BookOpen } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getRecentlyViewed, clearRecentlyViewed, type RecentBook } from '@/lib/recentlyViewed';
import type { Book, SearchCode } from '@/lib/types';

const SEARCH_TYPES: { code: SearchCode; label: string }[] = [
  { code: 'WRD', label: 'Всі поля' },
  { code: 'WTI', label: 'Назва' },
  { code: 'WAU', label: 'Автор' },
  { code: '020', label: 'ISBN' },
  { code: 'WSU', label: 'Тема' },
];

const PER_PAGE = 20;

function SearchContent() {
  const searchParams = useSearchParams();
  const initQ    = searchParams.get('q') ?? '';
  const initCode = (searchParams.get('code') ?? 'WRD') as SearchCode;

  const [query, setQuery]       = useState(initQ);
  const [code, setCode]         = useState<SearchCode>(initCode);
  const [books, setBooks]       = useState<Book[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [searched, setSearched] = useState('');
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);

  // Load recently viewed from localStorage
  useEffect(() => {
    setRecentBooks(getRecentlyViewed());
  }, []);

  const doSearch = useCallback(async (q: string, c: SearchCode, p: number) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const start = (p - 1) * PER_PAGE + 1;
      const res   = await fetch(`/api/search?q=${encodeURIComponent(q)}&code=${c}&start=${start}&count=${PER_PAGE}`);
      const data  = await res.json();
      if (data.error) throw new Error(data.error);
      setBooks(data.books ?? []);
      setTotal(data.total ?? 0);
      setSearched(q);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search on mount when URL has query (e.g. from author link)
  useEffect(() => {
    if (initQ) doSearch(initQ, initCode, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    doSearch(query, code, 1);
  };

  const handlePage = (p: number) => {
    setPage(p);
    doSearch(searched || query, code, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearched('');
    setBooks([]);
    setTotal(0);
    setQuery('');
    setError('');
    // Refresh recent list in case new books were viewed
    setRecentBooks(getRecentlyViewed());
  };

  const clearRecent = () => {
    clearRecentlyViewed();
    setRecentBooks([]);
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const isIdle = !loading && !searched;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-3 sm:px-4">
        <form
          onSubmit={handleSubmit}
          className={cn('transition-all', searched || loading ? 'py-4' : 'pt-16 pb-8')}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Назва, автор, ISBN..."
                autoFocus={!initQ}
                className="h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="h-10 px-5">
              {loading ? '…' : 'Шукати'}
            </Button>
            {searched && (
              <Button type="button" variant="ghost" size="sm" className="h-10" onClick={clearSearch}>
                ✕
              </Button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {SEARCH_TYPES.map((t) => (
              <button
                key={t.code}
                type="button"
                onClick={() => setCode(t.code)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  code === t.code
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && searched && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {total === 0
                ? `Нічого не знайдено за «${searched}»`
                : `Знайдено ${total} ${plural(total, 'запис', 'записи', 'записів')} за «${searched}»`}
            </p>

            {books.length > 0 && (
              <>
                <div className="space-y-2">
                  {books.map((book) => (
                    <BookCard key={book.sysNo} book={book} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2 pb-8">
                    <Button variant="outline" size="sm" onClick={() => handlePage(page - 1)} disabled={page === 1}>
                      ← Назад
                    </Button>
                    <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePage(page + 1)} disabled={page === totalPages}>
                      Вперед →
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {isIdle && (
          recentBooks.length > 0 ? (
            <section className="mt-2 pb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Нещодавно переглянуті</h2>
                <button
                  onClick={clearRecent}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Очистити
                </button>
              </div>
              <div className="space-y-2">
                {recentBooks.map((b) => (
                  <BookCard key={b.sysNo} book={b as unknown as Book} />
                ))}
              </div>
            </section>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-3 pb-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 opacity-20" />
              <p className="text-sm">Введи назву книги, автора або ISBN</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchContent />
    </Suspense>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
