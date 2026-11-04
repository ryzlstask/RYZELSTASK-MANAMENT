import { NextResponse } from 'next/server';
import {
  getBaileysLiveState,
  getOrInitBaileysSocket,
  disconnectBaileysSocket,
  requestBaileysPairingCode
} from '@/lib/baileysService';
import { getLivePortalState, queryPortalWithAi } from '@/lib/portalContext';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  await getOrInitBaileysSocket().catch(err => {
    console.error('Baileys ensure-init error:', err);
  });

  let liveState = getBaileysLiveState();

  // Wait briefly if initializing for the first time
  if ((liveState.status === 'connecting' || liveState.status === 'disconnected') && !liveState.qrDataUrl) {
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 400));
      liveState = getBaileysLiveState();
      if (liveState.qrDataUrl || liveState.status === 'connected') break;
    }
  }

  const portalSummary = getLivePortalState();

  return NextResponse.json({
    status: liveState.status,
    phoneNumber: liveState.phoneNumber,
    qrCodeDataUrl: liveState.qrDataUrl,
    pairingCode: liveState.pairingCode,
    lastUpdated: liveState.lastUpdated,
    taskManager: 'Talha Khan',
    portalSummary: portalSummary.metrics,
    isListenerEnabled: dataStore.isWhatsAppListenerEnabled()
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phoneNumber, query } = body;

    // 0. Toggle WhatsApp Auto-Processing / Listener ON or OFF
    if (action === 'toggle_listener') {
      const current = dataStore.isWhatsAppListenerEnabled();
      const nextState = typeof body.enabled === 'boolean' ? body.enabled : !current;
      const updated = dataStore.setWhatsAppListenerEnabled(nextState);
      return NextResponse.json({
        success: true,
        isListenerEnabled: updated,
        message: updated
          ? 'WhatsApp Auto-Processing system is now ACTIVE (ON).'
          : 'WhatsApp Auto-Processing system has been PAUSED (OFF).'
      });
    }

    // 1. Initialize / Refresh QR code
    if (action === 'refresh_qr' || action === 'init') {
      await disconnectBaileysSocket();
      getOrInitBaileysSocket().catch(console.error);

      // Give 1.5s for initial QR generation
      await new Promise(r => setTimeout(r, 1500));
      const state = getBaileysLiveState();

      return NextResponse.json({
        success: true,
        message: 'Fresh WhatsApp QR code requested from official WhatsApp servers.',
        ...state
      });
    }

    // 2. Disconnect WhatsApp Session
    if (action === 'disconnect') {
      await disconnectBaileysSocket();
      return NextResponse.json({
        success: true,
        message: 'WhatsApp session disconnected and credentials purged.',
        status: 'disconnected'
      });
    }

    // 3. Request WhatsApp 8-Digit Pairing Code (Phone number method)
    if (action === 'pair_code') {
      if (!phoneNumber) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }

      const code = await requestBaileysPairingCode(phoneNumber);
      return NextResponse.json({
        success: true,
        pairingCode: code,
        message: `Pairing code generated for ${phoneNumber}. Enter this code inside WhatsApp > Linked Devices.`
      });
    }

    // 4. Test Bot Querying the Live Portal
    if (action === 'query_portal') {
      if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      const result = queryPortalWithAi(query, phoneNumber);
      return NextResponse.json({
        success: true,
        query,
        ...result
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
