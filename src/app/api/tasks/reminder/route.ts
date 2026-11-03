import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { sendBaileysTextMessage } from '@/lib/baileysService';

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const task = dataStore.getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.assigned_employee_id) {
      return NextResponse.json({ error: 'No employee assigned to this task' }, { status: 400 });
    }

    const emp = dataStore.getEmployees().find(e => e.id === task.assigned_employee_id);
    if (!emp || !emp.phone_number) {
      return NextResponse.json({ error: 'Employee has no valid WhatsApp phone number' }, { status: 400 });
    }

    const firstName = emp.full_name.split(' ')[0] || emp.full_name;
    const deadlineFormatted = new Date(task.deadline).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const priorityFormatted = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    const hoursFormatted = task.estimated_hours ? `\n*Estimated Hours:* ${task.estimated_hours}h` : '';

    const reminderMessage = `Hello ${firstName},\n\nJust a friendly reminder about your assigned task:\n\n*Task:* ${task.title}\n*Priority:* ${priorityFormatted}\n*Deadline:* ${deadlineFormatted}${hoursFormatted}\n\nKindly share a quick progress update whenever you get a chance.\n\nReply with your status update:\n🔘 *COMPLETED*\n🔘 *IN PROGRESS*\n🔘 *BLOCKED*\n\nThank you! 😊`;

    const baileysRes = await sendBaileysTextMessage(
      emp.phone_number,
      reminderMessage,
      task.image_url
    );

    if (!baileysRes.success) {
      return NextResponse.json({
        success: false,
        error: baileysRes.error || 'Failed to dispatch WhatsApp message.'
      }, { status: 500 });
    }

    // Update last reminder timestamp
    task.last_reminder_sent_at = new Date().toISOString();
    dataStore.updateTask(task.id, { last_reminder_sent_at: task.last_reminder_sent_at });

    // Store in conversations
    let conv = dataStore.getConversations().find(c => c.phone_number === emp.phone_number);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        phone_number: emp.phone_number,
        contact_name: emp.full_name,
        contact_type: 'employee',
        employee_id: emp.id,
        is_human_takeover: false,
        unread_count: 0,
        last_message_at: new Date().toISOString(),
        last_message_preview: reminderMessage
      };
      dataStore.getConversations().unshift(conv);
    }
    dataStore.sendWhatsAppMessage(conv.id, reminderMessage, false);

    return NextResponse.json({
      success: true,
      message: `WhatsApp reminder dispatched to ${emp.full_name} (${emp.phone_number})`,
      last_reminder_sent_at: task.last_reminder_sent_at
    });
  } catch (err: any) {
    console.error('Error in task reminder endpoint:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

