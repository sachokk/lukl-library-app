'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Star, ExternalLink, Heart, BookOpen, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getBranchInfo } from '@/lib/addresses';
import { isOnShelf, toggleShelf } from '@/lib/shelf';
import { addToRecentlyViewed } from '@/lib/recentlyViewed';
import type { Book, LibraryItem, BookEnrichment } from '@/lib/types';

const LESYA_CODES = new Set(['156', '157', '158', 'OI', 'OZL', 'KRA', 'ONO', 'INT']);

function itemStatus(item: LibraryItem): { label: string; variant: 'available' | 'away' | 'processing' } {
  if (item.loanType === 'В обробці') return { label: 'В обробці', variant: 'processing' };
  if (item.onShelf)                  return { label: 'На полиці', variant: 'available' };
  return { label: item.dueDate ?? 'Видано', variant: 'away' };
}

function groupItems(items: LibraryItem[]) {
  const lesya: LibraryItem[] = [];
  const other: LibraryItem[] = [];
  for (const item of items) {
    (LESYA_CODES.has(item.sublibraryCode) ? lesya : other).push(item);
  }
  return { lesya, other };
}

function StatusDot({ variant }: { variant: 'available' | 'away' | 'processing' }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', {
        'bg-emerald-500': variant === 'available',
        'bg-rose-400':    variant === 'away',
        'bg-amber-400':   variant === 'processing',
      })}
    />
  );
}

function ItemRow({ item }: { item: LibraryItem }) {
  const status     = itemStatus(item);
  const branchInfo = getBranchInfo(item.sublibraryCode);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{item.sublibrary}</p>
        {branchInfo && (
          <p className="text-xs text-muted-foreground/70">
            {branchInfo.address}{branchInfo.district && ` · ${branchInfo.district}`}
          </p>
        )}
        <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {item.callNumber && <span>{item.callNumber}</span>}
          {item.loanType && item.loanType !== 'В обробці' && <span>{item.loanType}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <StatusDot variant={status.variant} />
        <span className="whitespace-pre-line text-right text-sm font-medium text-foreground/80">
          {status.label}
        </span>
      </div>
    </div>
  );
}

/** Cover area — always the same size (h-52 w-36) to prevent layout shift. */
function CoverSlot({ enrichmentDone, coverUrl, title }: {
  enrichmentDone: boolean;
  coverUrl?: string;
  title: string;
}) {
  const [imgState, setImgState] = useState<'loading' | 'ok' | 'fail'>('loading');

  // When enrichment finishes without a cover, show placeholder immediately
  useEffect(() => {
    if (enrichmentDone && !coverUrl) setImgState('fail');
  }, [enrichmentDone, coverUrl]);

  const showSkeleton = !enrichmentDone && imgState !== 'ok';
  const showImg      = !!coverUrl;
  const showFallback = enrichmentDone && (!coverUrl || imgState === 'fail');

  return (
    <div className="relative h-52 w-36 shrink-0">
      {/* Animated skeleton while loading */}
      {showSkeleton && (
        <div className="absolute inset-0 animate-pulse rounded-xl bg-muted" />
      )}

      {/* Actual cover image */}
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className={cn(
            'absolute inset-0 h-full w-full rounded-xl object-cover shadow-md transition-opacity duration-300',
            imgState === 'ok' ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth < 5) setImgState('fail');
            else setImgState('ok');
          }}
          onError={() => setImgState('fail')}
        />
      )}

      {/* Placeholder when no cover */}
      {showFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/60 ring-1 ring-foreground/8">
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          <span className="px-2 text-center text-[10px] leading-tight text-muted-foreground/40">
            Обкладинка недоступна
          </span>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </>
  );
}

export default function BookPage() {
  const { sysno } = useParams<{ sysno: string }>();
  const router    = useRouter();

  const [book, setBook]             = useState<Book | null>(null);
  const [items, setItems]           = useState<LibraryItem[] | null>(null);
  const [enrichment, setEnrichment] = useState<BookEnrichment | null>(null);
  const [enrichmentDone, setEnrDone] = useState(false);
  const [bookLoading, setBL]        = useState(true);
  const [itemsLoading, setIL]       = useState(true);
  const [onShelf, setOnShelf]       = useState(false);

  useEffect(() => {
    fetch(`/api/search?q=${sysno}&code=SYS&count=1`)
      .then((r) => r.json())
      .then((d) => {
        const b = d.books?.[0] ?? null;
        setBook(b);
        if (b) addToRecentlyViewed({ sysNo: sysno, title: b.title, authors: b.authors, year: b.year });
      })
      .catch(console.error)
      .finally(() => setBL(false));

    fetch(`/api/items/${sysno}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(console.error)
      .finally(() => setIL(false));

    fetch(`/api/enrichment/${sysno}`)
      .then((r) => r.json())
      .then((d: BookEnrichment) => setEnrichment(d))
      .catch(() => setEnrichment({}))
      .finally(() => setEnrDone(true));

    setOnShelf(isOnShelf(sysno));
  }, [sysno]);

  const handleShelfToggle = () => {
    if (!book) return;
    const nowOn = toggleShelf({ sysNo: sysno, title: book.title, authors: book.authors, year: book.year });
    setOnShelf(nowOn);
  };

  const { lesya, other } = items ? groupItems(items) : { lesya: [], other: [] };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-5">

        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад
        </button>

        {bookLoading ? (
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:gap-5">
            <div className="h-52 w-36 shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 space-y-3 pt-1">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </div>
        ) : book ? (
          <>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:gap-5">
              {/* Cover — always rendered, prevents layout shift */}
              <div className="flex justify-center sm:block">
                <CoverSlot
                  enrichmentDone={enrichmentDone}
                  coverUrl={enrichment?.coverUrl}
                  title={book.title}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-xl font-bold leading-snug text-foreground">
                    {book.title}
                    {book.subtitle && (
                      <span className="font-normal text-muted-foreground">
                        {': '}
                        {book.subtitle}
                      </span>
                    )}
                  </h1>
                  <button
                    onClick={handleShelfToggle}
                    className={cn(
                      'shrink-0 rounded-full p-1.5 transition-colors',
                      onShelf
                        ? 'text-rose-500'
                        : 'text-muted-foreground/50 hover:text-rose-400',
                    )}
                    aria-label={onShelf ? 'Видалити з полиці' : 'Додати на полицю'}
                  >
                    <Heart className={cn('h-5 w-5', onShelf && 'fill-rose-500')} />
                  </button>
                </div>

                {book.authors.length > 0 && (
                  <p className="mt-1 text-base text-muted-foreground">
                    {book.authors.map((a, i) => (
                      <span key={a}>
                        {i > 0 && ', '}
                        <Link
                          href={`/?q=${encodeURIComponent(a)}&code=WAU`}
                          className="transition-colors hover:text-primary hover:underline"
                        >
                          {a}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}

                {enrichment?.rating && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold">{enrichment.rating.toFixed(2)}</span>
                    {enrichment.ratingCount && (
                      <span className="text-xs text-muted-foreground">
                        ({enrichment.ratingCount.toLocaleString('uk-UA')} оцінок · Goodreads)
                      </span>
                    )}
                  </div>
                )}

                {enrichment?.choiceAwards && enrichment.choiceAwards.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {enrichment.choiceAwards.map((award) => (
                      <a
                        key={`${award.awardedAt}-${award.category}`}
                        href={award.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 transition-colors hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
                      >
                        <Trophy className="h-3 w-3 shrink-0" />
                        <span>
                          Goodreads Choice Award
                          {award.designation === 'WINNER' ? ' · Переможець' : ' · Номінант'}
                          {' · '}{award.category} ({award.awardedAt})
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
                  <MetaRow label="Рік"           value={book.year} />
                  <MetaRow label="Видавництво"   value={book.publisher} />
                  <MetaRow label="Місце видання" value={book.place} />
                  <MetaRow label="Обсяг"         value={book.pages} />
                  <MetaRow label="ISBN"          value={book.isbn} />
                  <MetaRow label="УДК"           value={book.udc} />
                  {book.genres.length > 0 && (
                    <>
                      <dt className="text-sm text-muted-foreground">Жанр</dt>
                      <dd className="flex flex-wrap gap-1">
                        {book.genres.map((g) => (
                          <Badge key={g} variant="secondary">{g}</Badge>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>

                {book.subjects.length > 0 && (
                  <ul className="mt-3 space-y-0.5">
                    {book.subjects.map((s) => (
                      <li key={s} className="text-xs text-muted-foreground">• {s}</li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={`http://alpha.lukl.kyiv.ua/F?func=direct&doc_number=${sysno}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Каталог бібліотеки
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {book.isbn && (
                    <a
                      href={`https://www.goodreads.com/book/isbn/${book.isbn.replace(/[^0-9X]/gi, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      Goodreads
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Description — always shown, placeholder when not available */}
            <Separator className="my-5" />
            <section className="mb-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Про книгу
              </h2>
              {!enrichmentDone ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : enrichment?.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {enrichment.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground/60">
                  Опис для цієї книги не знайдено в зовнішніх джерелах.
                </p>
              )}
            </section>
          </>
        ) : (
          <p className="text-muted-foreground">Метадані не знайдено (sys_no: {sysno})</p>
        )}

        <Separator className="my-5" />

        <section>
          {itemsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : items && items.length > 0 ? (
            <div className="space-y-5">
              {lesya.length > 0 && (
                <div>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    Бібліотека ім. Лесі Українки
                  </h2>
                  <div className="space-y-1.5">
                    {lesya.map((item, i) => <ItemRow key={i} item={item} />)}
                  </div>
                </div>
              )}

              {other.length > 0 && (
                <details className="group">
                  <summary className="mb-2 cursor-pointer list-none text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                    <span className="mr-1.5 inline-block transition-transform group-open:rotate-90">›</span>
                    Інші бібліотеки мережі ({other.length})
                  </summary>
                  <div className="mt-2 space-y-1.5">
                    {other.map((item, i) => <ItemRow key={i} item={item} />)}
                  </div>
                </details>
              )}
            </div>
          ) : items !== null ? (
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              Інформація про примірники недоступна.{' '}
              <a
                href={`http://alpha.lukl.kyiv.ua/F?func=item-global&doc_library=LUL01&doc_number=${sysno}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-primary"
              >
                Перевірити вручну →
              </a>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
