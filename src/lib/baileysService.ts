import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  WASocket
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { dataStore } from '@/lib/dataStore';
import { queryPortalWithAi } from '@/lib/portalContext';
import { resolvePhoneFromJidOrNumber } from '@/lib/phoneUtils';

export interface BaileysLiveState {
  status: 'connected' | 'connecting' | 'disconnected' | 'qr_ready';
  phoneNumber?: string;
  qrRaw?: string;
  qrDataUrl?: string;
  pairingCode?: string;
  lastUpdated: string;
  errorMessage?: string;
}

// Global persistent state across hot-reloads
declare global {
  var __baileysSocket: WASocket | null | undefined;
  var __baileysState: BaileysLiveState | undefined;
  var __baileysInitializing: boolean | undefined;
}

function getAuthDir(): string {
  return process.env.VERCEL
    ? path.join('/tmp', '.baileys_auth_session')
    : path.join(process.cwd(), '.baileys_auth_session');
}

if (!globalThis.__baileysState) {
  globalThis.__baileysState = {
    status: 'disconnected',
    lastUpdated: new Date().toISOString()
  };
}

export function getBaileysLiveState(): BaileysLiveState {
  return globalThis.__baileysState || {
    status: 'disconnected',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Initialize or retrieve the real Baileys WhatsApp Multi-Device Socket
 */
export async function getOrInitBaileysSocket(): Promise<WASocket | null> {
  if (globalThis.__baileysSocket) {
    attachMessageUpsertListener(globalThis.__baileysSocket);
    return globalThis.__baileysSocket;
  }

  if (globalThis.__baileysInitializing) {
    return null;
  }

  globalThis.__baileysInitializing = true;
  globalThis.__baileysState = {
    status: 'connecting',
    lastUpdated: new Date().toISOString()
  };

  try {
    const authDir = getAuthDir();
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    console.log('[Baileys] Initializing socket with authDir:', authDir);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: Browsers.windows('Desktop'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      syncFullHistory: false
    });

    globalThis.__baileysSocket = sock;

    // Listen to credentials update
    sock.ev.on('creds.update', saveCreds);

    // Listen to connection state updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('[Baileys] connection.update -> connection:', connection, 'qr present:', !!qr);
      if (lastDisconnect?.error) {
        console.log('[Baileys] lastDisconnect error:', lastDisconnect.error);
      }

      // 1. WhatsApp issued a real pairing QR code
      if (qr) {
        console.log('[Baileys] Real QR received, length:', qr.length);
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 8,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });

          globalThis.__baileysState = {
            status: 'qr_ready',
            qrRaw: qr,
            qrDataUrl,
            lastUpdated: new Date().toISOString()
          };
          dataStore.setBaileysStatus('qr_ready');
        } catch (err: any) {
          console.error('QR code generation error:', err);
        }
      }

      // 2. WhatsApp connection successfully opened!
      if (connection === 'open') {
        const userJid = sock.user?.id || '';
        const rawPhone = userJid.split(':')[0] || userJid.split('@')[0];
        const formattedPhone = rawPhone ? `+${rawPhone}` : 'Authenticated Device';

        globalThis.__baileysState = {
          status: 'connected',
          phoneNumber: formattedPhone,
          lastUpdated: new Date().toISOString()
        };

        dataStore.setBaileysStatus('connected', formattedPhone);
        dataStore.logAudit('Talha Khan Authenticated WhatsApp Multi-Device', 'system_setting', 'baileys_session', {}, { phoneNumber: formattedPhone });
      }

      // 3. Connection closed / disconnected
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (!shouldReconnect) {
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch {}
          globalThis.__baileysSocket = null;
          globalThis.__baileysState = {
            status: 'disconnected',
            lastUpdated: new Date().toISOString(),
            errorMessage: 'WhatsApp session logged out from mobile device.'
          };
          dataStore.setBaileysStatus('disconnected');
        } else {
          globalThis.__baileysSocket = null;
          globalThis.__baileysState = {
            status: 'connecting',
            lastUpdated: new Date().toISOString()
          };
          setTimeout(() => {
            getOrInitBaileysSocket().catch(console.error);
          }, 3000);
        }
      }
    });

    // Attach latest message handler
    attachMessageUpsertListener(sock);

    return sock;
  } catch (err: any) {
    globalThis.__baileysState = {
      status: 'disconnected',
      lastUpdated: new Date().toISOString(),
      errorMessage: err.message
    };
    return null;
  } finally {
    globalThis.__baileysInitializing = false;
  }
}

/**
 * Attach or update the messages.upsert listener with live reload resilience
 */
function attachMessageUpsertListener(sock: WASocket) {
  try {
    sock.ev.removeAllListeners('messages.upsert');
  } catch {}

  sock.ev.on('messages.upsert', async (m) => {
    if (!m.messages || m.messages.length === 0) return;

    // Master Switch Check: If turned OFF by manager, bypass all incoming processing
    if (!dataStore.isWhatsAppListenerEnabled()) {
      return;
    }

    for (const msg of m.messages) {
      if (!msg.message) continue;

      // CRITICAL: NEVER process outgoing messages or device echoes
      if (msg.key.fromMe) continue;

      const senderJid = msg.key.remoteJid || '';
      if (!senderJid || senderJid.endsWith('@g.us') || senderJid.endsWith('@broadcast')) continue;

      const body = msg.message.conversation || 
                   msg.message.extendedTextMessage?.text || 
                   (msg.message as any).buttonsResponseMessage?.selectedDisplayText ||
                   (msg.message as any).buttonsResponseMessage?.selectedButtonId ||
                   (msg.message as any).templateButtonReplyMessage?.selectedDisplayText ||
                   (msg.message as any).templateButtonReplyMessage?.selectedId ||
                   (msg.message as any).listResponseMessage?.title ||
                   msg.message.imageMessage?.caption || '';

      if (!body || !body.trim()) continue;

      const lowerBody = body.toLowerCase().trim();
      // Skip any bot message or automated echo
      if (
        lowerBody.startsWith('hello ') ||
        lowerBody.startsWith('thank you') ||
        lowerBody.startsWith('thankyou') ||
        lowerBody.includes('remarks:') ||
        lowerBody.includes('operations sheet') ||
        lowerBody.startsWith('📌') ||
        lowerBody.startsWith('🔔') ||
        lowerBody.startsWith('✅')
      ) {
        continue;
      }

      // Extract clean phone candidate with full WhatsApp Multi-Device LID resolution
      const rawPhone = resolvePhoneFromJidOrNumber(senderJid);
      const formattedSenderPhone = `+${rawPhone}`;
      console.log(`[Baileys Incoming] From ${formattedSenderPhone} (JID: ${senderJid}): "${body}"`);

      // 1. Ingest into standard conversations store
      dataStore.simulateIncomingWhatsApp(formattedSenderPhone, body);

      // 2. Silently update employee status & remarks in Operations Sheet (NO automated messages sent back)
      const replyResult = dataStore.recordEmployeeWhatsAppReply(rawPhone, body);
      console.log(`[Baileys Record Result]:`, replyResult.actionTaken);
    }
  });
}

/**
 * Force disconnect & reset the session
 */
export async function disconnectBaileysSocket(): Promise<void> {
  try {
    if (globalThis.__baileysSocket) {
      await globalThis.__baileysSocket.logout().catch(() => {});
      globalThis.__baileysSocket.end(undefined);
      globalThis.__baileysSocket = null;
    }

    const authDir = getAuthDir();
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }

    globalThis.__baileysState = {
      status: 'disconnected',
      lastUpdated: new Date().toISOString()
    };
    dataStore.setBaileysStatus('disconnected');
    dataStore.logAudit('Talha Khan Disconnected WhatsApp Session', 'system_setting', 'baileys_session', {}, { status: 'disconnected' });
  } catch (err: any) {
    console.error('Error disconnecting Baileys:', err);
  }
}

/**
 * Request an official 8-digit WhatsApp pairing code for linking via phone number
 */
export async function requestBaileysPairingCode(phoneNumber: string): Promise<string> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Please provide a valid phone number with country code (e.g. +923001234567)');
  }

  const sock = await getOrInitBaileysSocket();
  if (!sock) {
    throw new Error('Failed to initialize Baileys WhatsApp socket');
  }

  // Request pairing code from WhatsApp servers
  const code = await sock.requestPairingCode(cleanPhone);
  if (globalThis.__baileysState) {
    globalThis.__baileysState.pairingCode = code;
    globalThis.__baileysState.phoneNumber = `+${cleanPhone}`;
  }
  return code;
}

/**
 * Send a real WhatsApp text or image message via the active Baileys socket
 */
export async function sendBaileysTextMessage(
  rawPhoneNumber: string,
  messageText: string,
  imageUrl?: string
): Promise<{ success: boolean; jid?: string; messageId?: string; error?: string }> {
  try {
    if (!rawPhoneNumber || !rawPhoneNumber.trim()) {
      return { success: false, error: 'Recipient phone number is required' };
    }

    if (!messageText || !messageText.trim()) {
      return { success: false, error: 'Message text cannot be empty' };
    }

    let cleanPhone = rawPhoneNumber.replace(/[^0-9]/g, '');
    // Pakistani local format (0300... -> 92300...)
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }

    if (cleanPhone.length < 8) {
      return {
        success: false,
        error: `Invalid phone number "${rawPhoneNumber}". Please provide a full phone number with country code, e.g. +923001234567`
      };
    }

    const sock = await getOrInitBaileysSocket();
    if (!sock) {
      return {
        success: false,
        error: 'Baileys WhatsApp socket is not initialized'
      };
    }

    const liveState = getBaileysLiveState();
    if (liveState.status !== 'connected') {
      return {
        success: false,
        error: `WhatsApp is not connected (current status: "${liveState.status}"). Please scan the QR code in the Inbox tab to link your WhatsApp device first.`
      };
    }

    let targetJid = `${cleanPhone}@s.whatsapp.net`;

    // Attempt to verify/resolve JID if supported
    try {
      if (typeof sock.onWhatsApp === 'function') {
        const results = await sock.onWhatsApp(cleanPhone);
        if (Array.isArray(results) && results.length > 0) {
          if (results[0].exists && results[0].jid) {
            targetJid = results[0].jid;
          } else if (results[0].exists === false) {
            return {
              success: false,
              error: `The number +${cleanPhone} is not registered on WhatsApp.`
            };
          }
        }
      }
    } catch (checkErr) {
      console.warn('[Baileys] onWhatsApp check warning (proceeding with fallback JID):', checkErr);
    }

    let sent: any;
    if (imageUrl && imageUrl.trim()) {
      const trimmedUrl = imageUrl.trim();
      console.log(`[Baileys] Dispatching WhatsApp image message to ${targetJid} with caption`);

      if (trimmedUrl.startsWith('data:image/')) {
        // Base64 data URL
        const base64Data = trimmedUrl.includes(';base64,') ? trimmedUrl.split(';base64,')[1] : trimmedUrl;
        const imgBuffer = Buffer.from(base64Data, 'base64');
        sent = await sock.sendMessage(targetJid, {
          image: imgBuffer,
          caption: messageText
        });
      } else if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        // Remote image URL
        sent = await sock.sendMessage(targetJid, {
          image: { url: trimmedUrl },
          caption: messageText
        });
      } else if (fs.existsSync(trimmedUrl)) {
        // Local file path
        const fileBuffer = fs.readFileSync(trimmedUrl);
        sent = await sock.sendMessage(targetJid, {
          image: fileBuffer,
          caption: messageText
        });
      } else {
        // Fallback to text message if image path invalid
        sent = await sock.sendMessage(targetJid, { text: messageText });
      }
    } else {
      console.log(`[Baileys] Dispatching WhatsApp text message to ${targetJid}: "${messageText.substring(0, 60)}..."`);
      sent = await sock.sendMessage(targetJid, { text: messageText });
    }

    const msgId = sent?.key?.id;
    console.log(`[Baileys] Dispatched message ID ${msgId} to ${targetJid}`);
    return {
      success: true,
      jid: targetJid,
      messageId: msgId || undefined
    };
  } catch (err: any) {
    console.error('[Baileys] Failed to dispatch message:', err);
    return {
      success: false,
      error: err.message || 'WhatsApp transmission error'
    };
  }
}
