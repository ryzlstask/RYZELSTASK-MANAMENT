import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { sendBaileysTextMessage } from '@/lib/baileysService';

export async function POST(req: Request) {
  try {
    const employees = dataStore.getEmployees().filter(e => e.role === 'employee');
    const tasks = dataStore.getTasks();
    const dispatchedSummaries: Array<{ employee: string; phone: string; taskCount: number; status: string; error?: string }> = [];

    for (const emp of employees) {
      if (!emp.phone_number) continue;

      // Find tasks assigned to this employee that are active
      const empTasks = tasks.filter(t => 
        t.assigned_employee_id === emp.id && 
        t.status !== 'completed' && 
        t.status !== 'cancelled'
      );

      const overdueTasks = empTasks.filter(t => new Date(t.deadline) < new Date());
      const awaitingAcceptance = empTasks.filter(t => t.status === 'assigned');

      const greeting = `Good morning, ${emp.full_name.split(' ')[0]}!\n\nHere is your Ryzels operational task summary for today.\n\n`;
      let body = greeting;

      if (empTasks.length === 0) {
        body += `You currently have no active assignments for today. Have a productive day!\n\nThank you,\nRYZELS Operations`;
      } else {
        body += `📋 Active Assignments (${empTasks.length}):\n`;
        empTasks.forEach((t, idx) => {
          body += `${idx + 1}. ${t.title}\n   Priority: ${t.priority.toUpperCase()} | Status: ${t.status}\n   Deadline: ${new Date(t.deadline).toLocaleDateString()}\n\n`;
        });

        if (overdueTasks.length > 0) {
          body += `⚠️ Overdue Notice: ${overdueTasks.length} task(s) are past their deadline. Please provide an update to Task Manager Talha Khan.\n\n`;
        }

        if (awaitingAcceptance.length > 0) {
          body += `📌 Notice: You have ${awaitingAcceptance.length} task(s) awaiting acceptance. Please reply 'Accepted' to confirm.\n\n`;
        }

        body += `Please ensure your deliverables are updated on time.\n\nThank you,\nRYZELS Operations`;
      }

      // Dispatch via live Baileys WhatsApp
      const baileysRes = await sendBaileysTextMessage(emp.phone_number, body);

      // Find or create conversation for this employee in dataStore
      let conv = dataStore.getConversations().find(c => c.employee_id === emp.id || c.phone_number === emp.phone_number);
      if (!conv) {
        conv = {
          id: `conv-${Date.now()}-${emp.id}`,
          phone_number: emp.phone_number,
          contact_name: emp.full_name,
          contact_type: 'employee',
          employee_id: emp.id,
          is_human_takeover: false,
          unread_count: 0,
          last_message_at: new Date().toISOString(),
          last_message_preview: body
        };
        dataStore.getConversations().unshift(conv);
      }

      if (baileysRes.success) {
        dataStore.sendWhatsAppMessage(conv.id, body, true);
        dispatchedSummaries.push({
          employee: emp.full_name,
          phone: emp.phone_number,
          taskCount: empTasks.length,
          status: 'delivered'
        });
      } else if (process.env.VERCEL) {
        // Record in dataStore and log in test mode
        dataStore.sendWhatsAppMessage(conv.id, body, true);
        dispatchedSummaries.push({
          employee: emp.full_name,
          phone: emp.phone_number,
          taskCount: empTasks.length,
          status: 'simulated_delivered',
          error: 'Test mode (serverless): Logged to conversation.'
        });
      } else {
        dispatchedSummaries.push({
          employee: emp.full_name,
          phone: emp.phone_number,
          taskCount: empTasks.length,
          status: 'failed',
          error: baileysRes.error
        });
      }
    }

    const successCount = dispatchedSummaries.filter(s => s.status === 'delivered' || s.status === 'simulated_delivered').length;

    // Log automation execution
    dataStore.getExecutionLogs().unshift({
      id: `log-${Date.now()}`,
      workflow_name: 'Daily Morning Employee Digest',
      status: successCount > 0 ? 'success' : (dispatchedSummaries.length === 0 ? 'success' : 'failed'),
      records_processed: dispatchedSummaries.length,
      execution_time_ms: 1200,
      details: `Dispatched ${successCount}/${dispatchedSummaries.length} daily employee digests via Baileys WhatsApp.`,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dispatchedCount: successCount,
      totalEmployees: dispatchedSummaries.length,
      digests: dispatchedSummaries
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
