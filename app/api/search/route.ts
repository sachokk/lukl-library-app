import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/lib/aleph';
import type { SearchCode } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q     = searchParams.get('q')?.trim();
  const code  = (searchParams.get('code') ?? 'WRD') as SearchCode;
  const start = parseInt(searchParams.get('start') ?? '1', 10);
  const count = parseInt(searchParams.get('count') ?? '20', 10);

  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    const result = await searchBooks(q, code, start, count);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
