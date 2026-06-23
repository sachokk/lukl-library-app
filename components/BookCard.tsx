'use client';
import Link from 'next/link';
import type { Book } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function BookCard({ book }: { book: Book }) {
  const author = book.authors[0] ?? 'Невідомий автор';
  const genre = book.genres[0];

  return (
    <Link href={`/book/${book.sysNo}`} className="group block">
      <div
        className={cn(
          'rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/8',
          'transition-all duration-200 hover:ring-primary/40 hover:shadow-md hover:shadow-primary/5',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {book.title}
              {book.subtitle && (
                <span className="font-normal text-muted-foreground">
                  {': '}
                  {book.subtitle}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{author}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground/70">
              {book.year && <span>{book.year}</span>}
              {book.publisher && <span>{book.publisher}</span>}
              {book.pages && <span>{book.pages}</span>}
              {book.isbn && <span>ISBN {book.isbn}</span>}
            </div>
          </div>
          {genre && (
            <Badge variant="secondary" className="mt-0.5 shrink-0">
              {genre}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
