import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

// Webhook Verification (Meta WhatsApp Cloud API requirement)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ryzels_ops_verify_secret';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Verification failed', { status: 403 });
}

// Inbound Message Processing
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Parse Meta WhatsApp Cloud API Inbound message structure
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (message && message.type === 'text') {
      const from = message.from; // e.g. "923001112233"
      const text = message.text.body;

      const formattedPhone = from.startsWith('+') ? from : `+${from}`;
      dataStore.simulateIncomingWhatsApp(formattedPhone, text);
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

