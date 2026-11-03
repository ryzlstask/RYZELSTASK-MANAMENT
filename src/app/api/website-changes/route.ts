import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const websiteId = searchParams.get('website_id');
  const changes = dataStore.getWebsiteChanges(websiteId || undefined);
  return NextResponse.json(changes);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.requestTitle || !body.websiteId || !body.clientId) {
      return NextResponse.json({ error: 'Title, client, and website are required' }, { status: 400 });
    }

    const client = dataStore.getClients().find(c => c.id === body.clientId);
    const web = dataStore.getWebsites().find(w => w.id === body.websiteId);

    const newChange = dataStore.addWebsiteChange({
      client_id: body.clientId,
      client_name: client?.company_name || 'Client',
      website_id: body.websiteId,
      website_domain: web?.domain || 'domain.com',
      request_title: body.requestTitle,
      detailed_description: body.description || body.requestTitle,
      requester: body.requester || 'Client Admin',
      assigned_department_id: body.departmentId || 'dept-1',
      assigned_employee_id: body.assignedEmployeeId || 'emp-1',
      reviewer_id: 'emp-mgr',
      priority: body.priority || 'medium',
      deadline: body.deadline ? new Date(body.deadline).toISOString() : new Date(Date.now() + 2 * 86400000).toISOString(),
      current_status: 'New Request',
      before_change_reference: body.beforeReference,
    });

    return NextResponse.json(newChange, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updated = dataStore.updateWebsiteChangeStatus(id, status, notes);
    if (!updated) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

