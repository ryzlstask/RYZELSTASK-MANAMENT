import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { sendBaileysTextMessage, getBaileysLiveState } from '@/lib/baileysService';

export async function POST(req: Request) {
  try {
    const { employeeId, phoneNumber, customMessage, taskTitle } = await req.json();

    const emp = employeeId ? dataStore.getEmployees().find(e => e.id === employeeId) : null;
    const phone = phoneNumber || emp?.phone_number;

    if (!phone) {
      return NextResponse.json({ error: 'Valid phone number is required (e.g. +923001234567)' }, { status: 400 });
    }

    const greetingName = emp ? emp.full_name.split(' ')[0] : 'Team Member';
    
    // Find active tasks for this employee if any
    const empTasks = emp 
      ? dataStore.getTasks().filter(t => t.assigned_employee_id === emp.id && t.status !== 'completed' && t.status !== 'cancelled')
      : [];

    let taskDetailsText = '';
    if (taskTitle) {
      taskDetailsText = `\n\n📌 Active Task: "${taskTitle}"`;
    } else if (empTasks.length > 0) {
      taskDetailsText = `\n\n📋 Your Active Tasks (${empTasks.length}):\n` + 
        empTasks.map((t, i) => `${i + 1}. ${t.title} [${t.priority.toUpperCase()}]\n   Deadline: ${new Date(t.deadline).toLocaleDateString()}`).join('\n\n');
    }

    const messageBody = customMessage || (
      `Hello ${greetingName}!\n\nThis is an operational reminder from RYZELS Operations.${taskDetailsText}\n\nPlease ensure your deliverables are updated. If you encounter blockers, please message Task Manager Talha Khan.\n\nThank you,\nRYZELS Operations`
    );

    // 1. Dispatch real WhatsApp message via active Baileys socket
    const baileysResult = await sendBaileysTextMessage(phone, messageBody);

    if (!baileysResult.success) {
      // Vercel Serverless Test/Demo fallback
      if (process.env.VERCEL) {
        let conv = dataStore.getConversations().find(c => c.phone_number === phone);
        if (!conv) {
          conv = {
            id: `conv-${Date.now()}`,
            phone_number: phone,
            contact_name: emp?.full_name || 'Team Member',
            contact_type: 'employee',
            employee_id: emp?.id,
            is_human_takeover: false,
            unread_count: 0,
            last_message_at: new Date().toISOString(),
            last_message_preview: messageBody
          };
          dataStore.getConversations().unshift(conv);
        } else {
          conv.last_message_at = new Date().toISOString();
          conv.last_message_preview = messageBody;
        }

        dataStore.sendWhatsAppMessage(conv.id, messageBody, false);

        return NextResponse.json({
          success: true,
          simulated: true,
          jid: phone,
          warning: 'Vercel Test Mode: Reminder logged in Operations Sheet & Inbox (Real WhatsApp requires Hostinger VPS).'
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: baileysResult.error || 'Failed to dispatch WhatsApp reminder. Ensure WhatsApp is linked in Inbox.'
        },
        { status: 400 }
      );
    }

    // 2. Find or create conversation in dataStore
    let conv = dataStore.getConversations().find(c => c.phone_number === phone);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        phone_number: phone,
        contact_name: emp?.full_name || 'Team Member',
        contact_type: 'employee',
        employee_id: emp?.id,
        is_human_takeover: false,
        unread_count: 0,
        last_message_at: new Date().toISOString(),
        last_message_preview: messageBody
      };
      dataStore.getConversations().unshift(conv);
    }

    const sent = dataStore.sendWhatsAppMessage(conv.id, messageBody, false);

    // 3. Log in execution logs
    dataStore.getExecutionLogs().unshift({
      id: `log-${Date.now()}`,
      workflow_name: 'Direct Individual Employee Reminder',
      status: 'success',
      records_processed: 1,
      execution_time_ms: 320,
      details: `Dispatched real WhatsApp reminder via Baileys to ${phone} (${emp?.full_name || 'Individual'})`,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: sent,
      recipient: phone,
      jid: baileysResult.jid,
      messageId: baileysResult.messageId,
      deliveryChannel: 'Baileys Multi-Device Socket (Live)'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
