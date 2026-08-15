import { NextResponse } from 'next/server';
import { getZeffyStatus, isZeffyConfigured } from '@/lib/zeffy';
import { donationEnv } from '@/lib/config/env';
import { listDonations } from '@/lib/donations/store';

export async function GET() {
  const zeffy = getZeffyStatus();
  const donations = await listDonations();

  return NextResponse.json({
    ok: true,
    appEnv: donationEnv.appEnv,
    databaseConfigured: Boolean(donationEnv.databaseUrl),
    zeffyConfigured: isZeffyConfigured(),
    zeffy,
    receiptingEnabled: donationEnv.charity.receiptingEnabled,
    memoryDonations: donations.length,
    timestamp: new Date().toISOString(),
  });
}
