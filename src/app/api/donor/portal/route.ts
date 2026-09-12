import { NextResponse } from 'next/server';
import {
  cancelRecurringDonationForDonor,
  getDonorPortalSummary,
  getReceiptForDonor,
} from '@/lib/donations/service';
import { getAuthenticatedDonor } from '@/lib/auth/donor-gate';
import { assertSameOrigin } from '@/lib/security/request-guard';
import { z } from 'zod';

export async function GET() {
  const donor = await getAuthenticatedDonor();
  if (!donor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const summary = await getDonorPortalSummary(donor.id);
  return NextResponse.json({ donor, ...summary });
}

export async function POST(request: Request) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  const donor = await getAuthenticatedDonor();
  if (!donor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = z
    .object({
      action: z.enum(['cancel_recurring', 'get_receipt']),
      recurringId: z.string().optional(),
      receiptId: z.string().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (parsed.data.action === 'cancel_recurring') {
    if (!parsed.data.recurringId) {
      return NextResponse.json({ error: 'recurringId required' }, { status: 400 });
    }
    const result = await cancelRecurringDonationForDonor(parsed.data.recurringId, donor.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === 'get_receipt') {
    if (!parsed.data.receiptId) {
      return NextResponse.json({ error: 'receiptId required' }, { status: 400 });
    }
    const receipt = await getReceiptForDonor(parsed.data.receiptId, donor.id);
    if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ receipt });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
