import { NextResponse } from 'next/server';

/** Google Calendar push notifications — enable after watch channels are created. */
export async function POST(req: Request) {
  const channelId = req.headers.get('x-goog-channel-id');
  const resourceState = req.headers.get('x-goog-resource-state');
  console.info('[google:calendar:webhook:stub]', { channelId, resourceState });
  return NextResponse.json({ ok: true, stub: true });
}
