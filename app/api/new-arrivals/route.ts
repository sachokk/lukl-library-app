import { NextResponse } from 'next/server';
import { getNewArrivals } from '@/lib/aleph';

export async function GET() {
  try {
    const result = await getNewArrivals('156');
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch new arrivals' }, { status: 500 });
  }
}
