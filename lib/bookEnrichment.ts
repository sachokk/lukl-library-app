import type { BookEnrichment, ChoiceAward } from './types';

export type { BookEnrichment };

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── Goodreads scraper ────────────────────────────────────────────────────────
// Fetches https://www.goodreads.com/book/isbn/ISBN and extracts:
//   • cover image from JSON-LD "image"
//   • aggregateRating from JSON-LD
//   • description from __NEXT_DATA__ Apollo state (first Book with non-empty description)
//   • choiceAwards from __NEXT_DATA__ Apollo state Work object

interface GoodreadsResult {
  coverUrl?: string;
  description?: string;
  rating?: number;
  ratingCount?: number;
  choiceAwards?: ChoiceAward[];
}

async function fetchGoodreads(isbn: string): Promise<GoodreadsResult | null> {
  try {
    const res = await fetch(`https://www.goodreads.com/book/isbn/${isbn}`, {
      headers: { 'User-Agent': BROWSER_UA },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // 1. JSON-LD → cover + rating
    let coverUrl: string | undefined;
    let rating: number | undefined;
    let ratingCount: number | undefined;

    const ldMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    for (const m of ldMatches) {
      try {
        const ld = JSON.parse(m[1]);
        if (ld['@type'] === 'Book') {
          coverUrl = ld.image;
          if (ld.aggregateRating) {
            rating      = Number(ld.aggregateRating.ratingValue);
            ratingCount = Number(ld.aggregateRating.ratingCount);
          }
        }
      } catch { /* skip malformed blocks */ }
    }

    // 2. __NEXT_DATA__ → description + choiceAwards
    let description: string | undefined;
    let choiceAwards: ChoiceAward[] | undefined;

    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const apollo   = nextData?.props?.pageProps?.apolloState ?? {};
        for (const val of Object.values(apollo) as Record<string, unknown>[]) {
          if (!val || typeof val !== 'object') continue;
          const obj = val as Record<string, unknown>;

          if (obj.__typename === 'Book') {
            const desc = obj.description;
            if (!description && typeof desc === 'string' && desc.length > 50) {
              description = desc.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
            }
          }

          if (obj.__typename === 'Work' && Array.isArray(obj.choiceAwards) && obj.choiceAwards.length > 0) {
            choiceAwards = (obj.choiceAwards as ChoiceAward[]).filter(
              (a) => typeof a.awardedAt === 'number' && typeof a.category === 'string',
            );
          }
        }
      } catch { /* skip */ }
    }

    if (!coverUrl && !rating && !description && !choiceAwards) return null;
    return { coverUrl, description, rating, ratingCount, choiceAwards };
  } catch {
    return null;
  }
}

function stripHtml(s?: string): string | undefined {
  if (!s) return undefined;
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim() || undefined;
}

// ─── Google Books fallback ────────────────────────────────────────────────────

interface GBooksResponse {
  items?: Array<{
    volumeInfo: {
      description?: string;
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    };
  }>;
}

async function fetchGoogleBooks(query: string): Promise<GBooksResponse | null> {
  try {
    const url =
      `https://www.googleapis.com/books/v1/volumes?q=${query}` +
      `&fields=items(volumeInfo/description,volumeInfo/imageLinks)&maxResults=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

function extractGBCover(data: GBooksResponse): string | undefined {
  const links = data.items?.[0]?.volumeInfo?.imageLinks;
  const raw   = links?.thumbnail ?? links?.smallThumbnail;
  return raw ? raw.replace(/^http:\/\//, 'https://').replace('zoom=1', 'zoom=5') : undefined;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchEnrichment(
  isbn?: string,
  title?: string,
  author?: string,
): Promise<BookEnrichment> {
  const cleanIsbn = isbn?.replace(/[^0-9X]/gi, '');

  // 1. Goodreads by ISBN (cover + rating + Ukrainian description)
  if (cleanIsbn) {
    const gr = await fetchGoodreads(cleanIsbn);
    if (gr?.coverUrl || gr?.rating || gr?.description || gr?.choiceAwards) {
      return {
        coverUrl:     gr.coverUrl,
        description:  gr.description,
        rating:       gr.rating,
        ratingCount:  gr.ratingCount,
        choiceAwards: gr.choiceAwards,
        source:       'goodreads',
      };
    }
  }

  // 2. Google Books by ISBN → description + cover
  let description: string | undefined;
  let coverUrl: string | undefined;

  if (cleanIsbn) {
    const gb = await fetchGoogleBooks(`isbn:${cleanIsbn}`);
    if (gb) {
      description = stripHtml(gb.items?.[0]?.volumeInfo?.description);
      coverUrl    = extractGBCover(gb);
    }
  }

  // 3. Google Books by title+author if still no description
  if (!description && title) {
    const q = author
      ? `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
      : `intitle:${encodeURIComponent(title)}`;
    const gb = await fetchGoogleBooks(q);
    if (gb) {
      description = description ?? stripHtml(gb.items?.[0]?.volumeInfo?.description);
      coverUrl    = coverUrl   ?? extractGBCover(gb);
    }
  }

  // 4. Open Library cover as last resort (returns 1×1px if not found — client checks naturalWidth)
  if (!coverUrl && cleanIsbn) {
    coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
  }

  if (!coverUrl && !description) return {};

  return {
    coverUrl,
    description,
    source: coverUrl || description ? 'google' : 'openlibrary',
  };
}
