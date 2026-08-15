import { NextResponse } from 'next/server';
import { runZeffySync } from '@/lib/zeffy/sync';
import { getZeffyStatus } from '@/lib/zeffy';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';

export async function GET() {
  return NextResponse.json(getZeffyStatus());
}

export async function POST(request: Request) {
  const unlocked = await isAdminUnlocked();
  const cronSecret = request.headers.get('x-cron-secret');
  const allowed =
    unlocked || (process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET);

  if (!allowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runZeffySync();
  return NextResponse.json(result, { status: result.ok ? 200 : 202 });
}
