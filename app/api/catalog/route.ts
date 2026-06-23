import { NextRequest, NextResponse } from 'next/server';
import { searchCatalog } from '@/lib/aleph';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const subject    = searchParams.get('subject')?.trim();
  const sublibrary = searchParams.get('sublibrary') ?? '156';
  const page       = parseInt(searchParams.get('page') ?? '1', 10);
  const session    = searchParams.get('session') ?? undefined;

  if (!subject) return NextResponse.json({ error: 'Missing subject' }, { status: 400 });

  try {
    const result = await searchCatalog(subject, sublibrary, page, session);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Catalog search failed' }, { status: 500 });
  }
}
