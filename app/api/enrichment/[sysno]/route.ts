import { NextRequest, NextResponse } from 'next/server';
import { getBookByDocNumber } from '@/lib/aleph';
import { fetchEnrichment } from '@/lib/bookEnrichment';

export async function GET(
  _req: NextRequest,
  { params }: { params: { sysno: string } },
) {
  try {
    const book = await getBookByDocNumber(params.sysno);
    if (!book) return NextResponse.json({});

    const result = await fetchEnrichment(book.isbn, book.title, book.authors[0]);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({});
  }
}
