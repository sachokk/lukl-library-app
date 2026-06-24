import { NextRequest, NextResponse } from 'next/server';
import { searchBooks, searchBooksFiltered } from '@/lib/aleph';
import type { SearchCode, Book } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q     = searchParams.get('q')?.trim();
  const code  = (searchParams.get('code') ?? 'WRD') as SearchCode;
  const lesya = searchParams.get('lesya') === '1';
  const lang  = searchParams.get('lang') ?? undefined;

  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    if (lesya || lang) {
      const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
      const session = searchParams.get('session') ?? undefined;
      const result  = await searchBooksFiltered(q, code, page, session, lesya, lang);
      const books: Book[] = result.books.map((b) => ({ ...b, subjects: [], genres: [] }));
      return NextResponse.json({ books, total: result.total, session: result.session });
    }

    const start  = parseInt(searchParams.get('start') ?? '1', 10);
    const count  = parseInt(searchParams.get('count') ?? '20', 10);
    const result = await searchBooks(q, code, start, count);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
