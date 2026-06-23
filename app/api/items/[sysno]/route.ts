import { NextRequest, NextResponse } from 'next/server';
import { getItemAvailability } from '@/lib/aleph';

export async function GET(
  _req: NextRequest,
  { params }: { params: { sysno: string } },
) {
  try {
    const items = await getItemAvailability(params.sysno);
    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
