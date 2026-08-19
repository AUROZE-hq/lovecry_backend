import { NextResponse } from 'next/server';
import { AuthError, requirePermission } from '@/lib/auth/permissions';
import { EventImageStorageError, saveEventImage } from '@/lib/events/image-storage';
import { assertSameOrigin } from '@/lib/security/request-guard';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const origin = assertSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({ success: false, error: origin.error }, { status: origin.status });
  }

  try {
    await requirePermission('events.write');
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    throw err;
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'No image file was provided.' }, { status: 400 });
  }

  try {
    const saved = await saveEventImage(file);
    return NextResponse.json({
      success: true,
      image: { url: saved.url },
    });
  } catch (err) {
    if (err instanceof EventImageStorageError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, error: 'Unable to upload image.' }, { status: 500 });
  }
}
