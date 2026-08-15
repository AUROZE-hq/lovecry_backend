import { NextResponse } from 'next/server';
import { getDonationStatus, markDonationPaid } from '@/lib/donations/service';
import { isMockPayAllowed } from '@/lib/config/env';
import { assertSameOrigin } from '@/lib/security/request-guard';

type Params = { params: Promise<{ reference: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { reference } = await params;
  const result = await getDonationStatus(reference);

  if (!result) {
    return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
  }

  return NextResponse.json({
    reference: result.donation.reference,
    status: result.donation.status,
    amountCents: result.donation.amountCents,
    campaignName: result.donation.campaignName,
    frequency: result.donation.frequency,
    receiptStatus: result.donation.receiptStatus,
    receiptNumber: result.donation.receiptNumber,
    eligibility: result.eligibility,
    confirmationEmailStatus: result.donation.confirmationEmailStatus,
  });
}

/** Development-only helper. Impossible in production builds. */
export async function POST(request: Request, { params }: Params) {
  const { reference } = await params;
  const body = (await request.json().catch(() => ({}))) as { mockPay?: boolean };

  if (!body.mockPay) {
    return NextResponse.json(
      { error: 'Only mockPay is supported until Zeffy sync is enabled.' },
      { status: 400 }
    );
  }

  if (!isMockPayAllowed()) {
    return NextResponse.json({ error: 'Mock pay is disabled.' }, { status: 403 });
  }

  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ error: origin.error }, { status: origin.status });
  }

  try {
    const donation = await markDonationPaid({ reference });
    return NextResponse.json({
      reference: donation.reference,
      status: donation.status,
      receiptStatus: donation.receiptStatus,
      receiptNumber: donation.receiptNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to mark paid';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
