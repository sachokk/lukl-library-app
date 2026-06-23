'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutList, LayoutGrid, Grid3X3 } from 'lucide-react';
import { CATEGORIES, type Category } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CatalogBook } from '@/lib/types';

const PER_PAGE = 20;
const LAYOUT_KEY = 'library_catalog_layout';
type LayoutCols = 1 | 2 | 3;

const LAYOUTS: { cols: LayoutCols; icon: typeof LayoutList; label: string }[] = [
  { cols: 1, icon: LayoutList, label: 'Список'    },
  { cols: 2, icon: LayoutGrid, label: '2 колонки' },
  { cols: 3, icon: Grid3X3,    label: '3 колонки' },
];

function readLayout(): LayoutCols {
  if (typeof window === 'undefined') return 2;
  const v = window.localStorage.getItem(LAYOUT_KEY);
  return (v === '1' || v === '2' || v === '3') ? Number(v) as LayoutCols : 2;
}

function CatalogCard({ book, cols }: { book: CatalogBook; cols: LayoutCols }) {
  const compact = cols === 3;
  return (
    <Link href={`/book/${book.sysNo}`} className="group block h-full">
      <div className="flex h-full flex-col rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/8 transition-all duration-200 hover:ring-primary/40 hover:shadow-md hover:shadow-primary/5">
        <p className={cn(
          'font-semibold leading-snug text-foreground transition-colors group-hover:text-primary',
          compact ? 'text-xs' : 'text-sm',
        )}>
          {book.title}
        </p>
        {book.authors.length > 0 && (
          <p className={cn('mt-1 text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>
            {book.authors.join(', ')}
          </p>
        )}
        {book.year && (
          <p className={cn('mt-auto pt-1.5 text-muted-foreground/50', compact ? 'text-[10px]' : 'text-xs')}>
            {book.year}
          </p>
        )}
      </div>
    </Link>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const categoryId = searchParams.get('category') ?? '';
  const pageNum    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const selected = CATEGORIES.find((c) => c.id === categoryId) ?? null;

  const [books, setBooks]         = useState<CatalogBook[]>([]);
  const [total, setTotal]         = useState(0);
  const [session, setSession]     = useState<string | undefined>(undefined);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [loadedFor, setLoadedFor] = useState('');
  const [cols, setCols]           = useState<LayoutCols>(2);

  useEffect(() => { setCols(readLayout()); }, []);

  const setLayout = (c: LayoutCols) => {
    setCols(c);
    localStorage.setItem(LAYOUT_KEY, String(c));
  };

  const load = useCallback(async (cat: Category, p: number, sess?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ subject: cat.subject, page: String(p) });
      if (p > 1 && sess) params.set('session', sess);
      const res  = await fetch(`/api/catalog?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBooks(data.books ?? []);
      setTotal(data.total ?? 0);
      if (data.session) setSession(data.session);
      setLoadedFor(`${cat.id}|${p}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, []);

  const prevCategoryRef = useRef('');
  useEffect(() => {
    if (!selected) return;
    const key = `${selected.id}|${pageNum}`;
    if (loadedFor === key) return;
    const prevCat = prevCategoryRef.current;
    prevCategoryRef.current = selected.id;
    load(selected, pageNum, prevCat === selected.id ? session : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, pageNum]);

  const selectCategory = (cat: Category) => {
    router.push(`/catalog?category=${cat.id}`);
  };

  const handlePage = (p: number) => {
    router.push(`/catalog?category=${categoryId}&page=${p}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  const gridClass: Record<LayoutCols, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold tracking-tight">Каталог за розділами</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Книги в Абонементі бібліотеки</p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all duration-150',
                'ring-1 focus-visible:ring-2 focus-visible:ring-ring',
                selected?.id === cat.id
                  ? 'bg-primary/10 ring-primary/40 shadow-sm'
                  : 'bg-card ring-foreground/8 hover:ring-primary/30 hover:shadow-sm',
              )}
            >
              <span className="text-2xl leading-none">{cat.icon}</span>
              <span className={cn(
                'text-xs font-medium leading-tight',
                selected?.id === cat.id ? 'text-primary' : 'text-foreground/80',
              )}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Results */}
        {selected ? (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex flex-1 items-baseline gap-2">
                <h2 className="font-semibold text-foreground">
                  {selected.icon} {selected.label}
                </h2>
                {!loading && total > 0 && (
                  <span className="text-sm text-muted-foreground">
                    — {total} {plural(total, 'книга', 'книги', 'книг')}
                  </span>
                )}
              </div>

              {/* Layout switcher */}
              <div className="flex items-center gap-0.5 rounded-lg bg-muted p-1">
                {LAYOUTS.map(({ cols: c, icon: Icon, label }) => (
                  <button
                    key={c}
                    onClick={() => setLayout(c)}
                    title={label}
                    className={cn(
                      'rounded-md p-1.5 transition-colors',
                      cols === c
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            {loading ? (
              <div className={cn('grid gap-2', gridClass[cols])}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : books.length > 0 ? (
              <>
                <div className={cn('grid gap-2', gridClass[cols])}>
                  {books.map((book) => (
                    <CatalogCard key={book.sysNo} book={book} cols={cols} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-2 pb-8">
                    <Button variant="outline" size="sm" onClick={() => handlePage(pageNum - 1)} disabled={pageNum === 1}>
                      ← Назад
                    </Button>
                    <span className="text-sm text-muted-foreground">{pageNum} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePage(pageNum + 1)} disabled={pageNum === totalPages}>
                      Вперед →
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                В Абонементі нічого не знайдено за розділом «{selected.label}».
              </p>
            )}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Оберіть розділ, щоб побачити книги в Абонементі
          </p>
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CatalogContent />
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
