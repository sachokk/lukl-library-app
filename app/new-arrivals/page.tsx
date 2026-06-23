'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import type { CatalogBook } from '@/lib/types';

function NewArrivalCard({ book }: { book: CatalogBook }) {
  return (
    <Link href={`/book/${book.sysNo}`} className="group block">
      <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/8 transition-all duration-200 hover:ring-primary/40 hover:shadow-md hover:shadow-primary/5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {book.title}
        </p>
        {book.authors.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">{book.authors[0]}</p>
        )}
        {book.year && (
          <p className="mt-0.5 text-xs text-muted-foreground/60">{book.year}</p>
        )}
      </div>
    </Link>
  );
}

export default function NewArrivalsPage() {
  const [books, setBooks]   = useState<CatalogBook[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch('/api/new-arrivals')
      .then((r) => r.json())
      .then((d) => { setBooks(d.books ?? []); setTotal(d.total ?? 0); })
      .catch(() => setError('Не вдалося завантажити новинки'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Нові надходження</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {loading ? 'Завантаження…' : `${total} ${plural(total, 'книга', 'книги', 'книг')} у ${year} році`}
            </p>
          </div>
          {!loading && total > books.length && (
            <a
              href={`http://alpha.lukl.kyiv.ua/F?func=find-b&find_code=WYR&request=${year}&filter_code_4=WSBL&filter_request_4=156&local_base=lul01`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-primary hover:underline"
            >
              Всі у ОПАК →
            </a>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {books.map((b) => (
              <NewArrivalCard key={b.sysNo} book={b} />
            ))}
          </div>
        ) : !error ? (
          <p className="text-center text-sm text-muted-foreground">
            Ще немає нових надходжень за {year} рік.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
