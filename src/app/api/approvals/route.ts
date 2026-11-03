import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(req: Request) {
  try {
    const { action, id, approve, notes } = await req.json();

    if (!action || !id) {
      return NextResponse.json({ error: 'Action and entity ID are required' }, { status: 400 });
    }

    if (action === 'extension') {
      const result = dataStore.resolveExtensionRequest(id, approve, notes || '');
      return NextResponse.json({ success: true, result });
    }

    if (action === 'website_change') {
      const nextStatus = approve ? 'Approved' : 'Rejected';
      const result = dataStore.updateWebsiteChangeStatus(id, nextStatus, notes);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'task_review') {
      const nextStatus = approve ? 'completed' : 'changes_requested';
      const result = dataStore.updateTaskStatus(id, nextStatus);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: 'Unknown approval action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

