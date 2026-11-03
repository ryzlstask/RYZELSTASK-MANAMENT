import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';
import { sendBaileysTextMessage } from '@/lib/baileysService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const websiteId = searchParams.get('website_id');
  const clientId = searchParams.get('client_id');

  let tasks = dataStore.getTasks();
  if (websiteId) {
    tasks = tasks.filter(t => t.website_id === websiteId);
  }
  if (clientId) {
    tasks = tasks.filter(t => t.client_id === clientId);
  }

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const taskText = (body.task || body.title || '').trim();
    if (!taskText) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 });
    }

    const assignedEmp = body.employeeId
      ? dataStore.getEmployees().find(e => e.id === body.employeeId)
      : undefined;

    const department = body.departmentId 
      ? dataStore.getDepartments().find(d => d.id === body.departmentId)
      : (assignedEmp ? dataStore.getDepartments().find(d => d.id === assignedEmp.department_id) : undefined);

    const newTask = dataStore.addTask({
      title: taskText,
      description: body.description?.trim() || taskText,
      client_id: body.clientId,
      website_id: body.websiteId,
      project_name: body.projectName || 'Operations',
      department_id: department?.id || 'dept-1',
      category: body.category || 'Website maintenance',
      assigned_employee_id: body.employeeId || undefined,
      assigned_employee_name: assignedEmp?.full_name || 'Unassigned',
      reviewer_id: 'emp-mgr',
      reviewer_name: 'Talha Khan',
      priority: body.priority || 'high',
      status: 'assigned', // Marked in Excel sheet as ASSIGNED on initial dispatch
      estimated_hours: Number(body.hours || 0),
      deliverables: body.deliverables || 'Completed deliverables as instructed.',
      deadline: body.deadline ? new Date(body.deadline).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(),
      image_url: body.imageUrl || body.image_url || undefined,
      employee_remarks: body.employeeRemarks || undefined,
    });

    let whatsappDispatched = false;
    let whatsappError: string | undefined;

    // Immediately dispatch real WhatsApp message with image to the assigned employee
    if (assignedEmp && assignedEmp.phone_number) {
      const firstName = assignedEmp.full_name.split(' ')[0] || assignedEmp.full_name;
      const deadlineFormatted = new Date(newTask.deadline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const priorityFormatted = newTask.priority.charAt(0).toUpperCase() + newTask.priority.slice(1);
      const hoursFormatted = newTask.estimated_hours ? `\n*Estimated Hours:* ${newTask.estimated_hours}h` : '';

      const assignmentMessage = `Hello ${firstName},\n\nA new task has been assigned to you:\n\n*Task:* ${newTask.title}\n*Priority:* ${priorityFormatted}\n*Deadline:* ${deadlineFormatted}${hoursFormatted}\n\nPlease have a look and complete it within the given deadline.\n\nThank you for your cooperation! 😊`;

      try {
        const baileysRes = await sendBaileysTextMessage(
          assignedEmp.phone_number,
          assignmentMessage,
          newTask.image_url
        );

        if (baileysRes.success) {
          whatsappDispatched = true;

          // Find or create conversation in dataStore
          let conv = dataStore.getConversations().find(c => c.phone_number === assignedEmp.phone_number);
          if (!conv) {
            conv = {
              id: `conv-${Date.now()}`,
              phone_number: assignedEmp.phone_number,
              contact_name: assignedEmp.full_name,
              contact_type: 'employee',
              employee_id: assignedEmp.id,
              is_human_takeover: false,
              unread_count: 0,
              last_message_at: new Date().toISOString(),
              last_message_preview: assignmentMessage
            };
            dataStore.getConversations().unshift(conv);
          }

          dataStore.sendWhatsAppMessage(conv.id, assignmentMessage, false);

          dataStore.getExecutionLogs().unshift({
            id: `log-${Date.now()}`,
            workflow_name: 'Immediate Task Assignment WhatsApp Dispatch',
            status: 'success',
            records_processed: 1,
            execution_time_ms: 310,
            details: `Dispatched task assignment "${newTask.title}" directly to ${assignedEmp.full_name} (${assignedEmp.phone_number})`,
            created_at: new Date().toISOString()
          });
        } else {
          whatsappError = baileysRes.error;
          console.warn('[Task API] WhatsApp dispatch warning:', baileysRes.error);
        }
      } catch (err: any) {
        whatsappError = err.message;
        console.error('[Task API] Failed to send assignment WhatsApp message:', err);
      }
    }

    return NextResponse.json({
      ...newTask,
      whatsapp_dispatched: whatsappDispatched,
      whatsapp_error: whatsappError,
      assigned_employee_phone: assignedEmp?.phone_number
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updatedTask = dataStore.updateTask(body.id, {
      ...(body.status ? { status: body.status } : {}),
      ...(body.employee_remarks !== undefined ? { employee_remarks: body.employee_remarks } : {}),
      ...(body.title ? { title: body.title } : {}),
      ...(body.description ? { description: body.description } : {}),
      ...(body.deadline ? { deadline: new Date(body.deadline).toISOString() } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
      ...(body.image_url !== undefined ? { image_url: body.image_url } : {})
    });

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const success = dataStore.deleteTask(id);
    if (!success) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Task ${id} deleted` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
