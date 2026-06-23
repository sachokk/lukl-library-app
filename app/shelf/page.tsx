'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getShelf, clearShelf, removeFromShelf, type ShelfBook } from '@/lib/shelf';

export default function ShelfPage() {
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBooks(getShelf());
    setHydrated(true);
  }, []);

  const handleClear = () => {
    clearShelf();
    setBooks([]);
  };

  const handleRemove = (sysNo: string) => {
    removeFromShelf(sysNo);
    setBooks(getShelf());
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Моя полиця</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {books.length === 0
                ? 'Немає збережених книг'
                : `${books.length} ${plural(books.length, 'книга', 'книги', 'книг')}`}
            </p>
          </div>
          {books.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Очистити полицю
            </Button>
          )}
        </div>

        {books.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Heart className="h-10 w-10 opacity-15" />
            <p className="text-center text-sm">
              Полиця порожня — натисни ♡ на сторінці книги, щоб зберегти
            </p>
            <Link href="/" className="mt-2 text-sm text-primary hover:underline">
              До пошуку
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {books.map((book) => (
              <div
                key={book.sysNo}
                className="group flex items-start gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/8 transition-all hover:ring-primary/30 hover:shadow-sm"
              >
                <Link href={`/book/${book.sysNo}`} className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {book.title}
                  </p>
                  {book.authors.length > 0 && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{book.authors[0]}</p>
                  )}
                  {book.year && (
                    <p className="mt-0.5 text-xs text-muted-foreground/60">{book.year}</p>
                  )}
                </Link>
                <button
                  onClick={() => handleRemove(book.sysNo)}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:text-destructive"
                  aria-label="Видалити з полиці"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
