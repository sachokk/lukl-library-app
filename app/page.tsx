'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const router       = useRouter();
  const initQ       = searchParams.get('q') ?? '';
  const initCode    = (searchParams.get('code') ?? 'WRD') as SearchCode;
  const initPage    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const initLesya   = searchParams.get('lesya') === '1';
  const initSession = searchParams.get('session') ?? undefined;

  const [query, setQuery]         = useState(initQ);
  const [code, setCode]           = useState<SearchCode>(initCode);
  const [onlyLesya, setOnlyLesya] = useState(initLesya);
  const [session, setSession]     = useState<string | undefined>(initSession);
  const [books, setBooks]         = useState<Book[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(initPage);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [searched, setSearched]   = useState('');
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);

  useEffect(() => {
    setRecentBooks(getRecentlyViewed());
  }, []);

  const doSearch = useCallback(async (
    q: string, c: SearchCode, p: number, lesya: boolean, sess?: string,
  ) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      let url: string;
      if (lesya) {
        const params = new URLSearchParams({ q, code: c, page: String(p) });
        params.set('lesya', '1');
        if (sess) params.set('session', sess);
        url = `/api/search?${params}`;
      } else {
        const start = (p - 1) * PER_PAGE + 1;
        url = `/api/search?q=${encodeURIComponent(q)}&code=${c}&start=${start}&count=${PER_PAGE}`;
      }
      const res  = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBooks(data.books ?? []);
      setTotal(data.total ?? 0);
      setSearched(q);
      if (data.session) setSession(data.session);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search on mount when URL has query (back navigation or author link)
  useEffect(() => {
    if (initQ) doSearch(initQ, initCode, initPage, initLesya, initSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildUrl = (q: string, c: SearchCode, p: number, lesya: boolean, sess?: string) => {
    const params = new URLSearchParams({ q, code: c });
    if (lesya) params.set('lesya', '1');
    if (p > 1) params.set('page', String(p));
    if (lesya && sess) params.set('session', sess);
    return `/?${params}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSession(undefined);
    doSearch(query, code, 1, onlyLesya);
    router.replace(buildUrl(query, code, 1, onlyLesya));
  };

  const handlePage = (p: number) => {
    setPage(p);
    const q    = searched || query;
    const sess = p === 1 ? undefined : session;
    doSearch(q, code, p, onlyLesya, sess);
    router.replace(buildUrl(q, code, p, onlyLesya, sess));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLesyaToggle = () => {
    const next = !onlyLesya;
    setOnlyLesya(next);
    if (searched) {
      setPage(1);
      setSession(undefined);
      doSearch(searched, code, 1, next);
      router.replace(buildUrl(searched, code, 1, next));
    }
  };

  const clearSearch = () => {
    setSearched('');
    setBooks([]);
    setTotal(0);
    setQuery('');
    setError('');
    setSession(undefined);
    router.replace(onlyLesya ? '/?lesya=1' : '/');
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

          {/* Filters panel */}
          <div className="mt-2.5 space-y-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Фільтри
            </p>

            {/* Availability toggle */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleLesyaToggle}
              onKeyDown={(e) => e.key === 'Enter' && handleLesyaToggle()}
              className="flex cursor-pointer select-none items-center gap-2.5"
            >
              <span
                className={cn(
                  'relative inline-flex h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200',
                  onlyLesya ? 'bg-primary' : 'bg-input',
                )}
              >
                <span
                  className={cn(
                    'absolute top-[3px] inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-200',
                    onlyLesya ? 'translate-x-[18px]' : 'translate-x-[3px]',
                  )}
                />
              </span>
              <span className="text-xs leading-snug text-foreground">
                В наявності в бібліотеці ім. Лесі Українки
              </span>
            </div>

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
                ? `Нічого не знайдено за «${searched}»${onlyLesya ? ' · ім. Лесі' : ''}`
                : `Знайдено ${total} ${plural(total, 'запис', 'записи', 'записів')} за «${searched}»${onlyLesya ? ' · ім. Лесі' : ''}`
              }
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
