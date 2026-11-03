import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { sendBaileysTextMessage, getBaileysLiveState } from '@/lib/baileysService';

export async function POST(req: Request) {
  try {
    const { phoneNumber, message, conversationId } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message body cannot be empty' }, { status: 400 });
    }

    let targetPhone = phoneNumber;
    let targetConvId = conversationId;

    // Resolve target phone and conversation
    if (targetConvId) {
      const conv = dataStore.getConversations().find(c => c.id === targetConvId);
      if (conv && !targetPhone) {
        targetPhone = conv.phone_number;
      }
    } else if (targetPhone) {
      let conv = dataStore.getConversations().find(c => c.phone_number === targetPhone);
      if (!conv) {
        const emp = dataStore.getEmployees().find(e => e.phone_number === targetPhone);
        conv = {
          id: `conv-${Date.now()}`,
          phone_number: targetPhone,
          contact_name: emp ? emp.full_name : targetPhone,
          contact_type: emp ? 'employee' : 'client',
          employee_id: emp?.id,
          is_human_takeover: true,
          unread_count: 0,
          last_message_at: new Date().toISOString(),
          last_message_preview: message
        };
        dataStore.getConversations().unshift(conv);
      }
      targetConvId = conv.id;
    }

    if (!targetPhone) {
      return NextResponse.json(
        { error: 'Valid recipient phone number is required (e.g. +923001234567)' },
        { status: 400 }
      );
    }

    // 1. Dispatch real message via active Baileys WhatsApp Multi-Device socket
    const baileysResult = await sendBaileysTextMessage(targetPhone, message);

    if (!baileysResult.success) {
      if (process.env.VERCEL) {
        const sentMsg = dataStore.sendWhatsAppMessage(targetConvId || 'conv-1', message, false);
        return NextResponse.json({
          success: true,
          simulated: true,
          message: sentMsg,
          warning: 'Vercel Test Mode: WhatsApp socket is offline in serverless environment. Message logged in Inbox (Live 24/7 WhatsApp requires Hostinger VPS).'
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: baileysResult.error || 'Failed to dispatch WhatsApp message. Ensure your device is linked in Inbox.'
        },
        { status: 400 }
      );
    }

    // 2. Record successfully delivered message in local dataStore
    const sentMsg = dataStore.sendWhatsAppMessage(targetConvId || 'conv-1', message, false);

    // 3. Log audit trail
    dataStore.logAudit(
      `Dispatched Real WhatsApp Message to ${targetPhone}`,
      'whatsapp_message',
      targetConvId || 'conv-1',
      {},
      {
        phoneNumber: targetPhone,
        targetJid: baileysResult.jid,
        messageId: baileysResult.messageId,
        snippet: message.substring(0, 50)
      }
    );

    return NextResponse.json({
      success: true,
      message: sentMsg,
      jid: baileysResult.jid,
      messageId: baileysResult.messageId,
      gateway: 'Baileys Multi-Device Socket (Live)'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
