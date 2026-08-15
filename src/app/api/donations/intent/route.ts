import { NextResponse } from 'next/server';
import { CreateDonationIntentSchema } from '@/lib/donations/types';
import { createDonationIntent } from '@/lib/donations/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateDonationIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid donation intent', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const donation = await createDonationIntent(parsed.data);
    return NextResponse.json({
      id: donation.id,
      reference: donation.reference,
      status: donation.status,
      amountCents: donation.amountCents,
      campaignName: donation.campaignName,
      frequency: donation.frequency,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create donation intent';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
