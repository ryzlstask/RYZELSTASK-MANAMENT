import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  try {
    const departments = dataStore.getDepartments();
    return NextResponse.json(departments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const code = body.code?.trim().toUpperCase() || body.name.trim().substring(0, 4).toUpperCase();
    const newDept = dataStore.addDepartment({
      name: body.name.trim(),
      code,
      description: body.description?.trim() || `Department for ${body.name}`,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true
    });

    return NextResponse.json(newDept, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const updated = dataStore.updateDepartment(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const success = dataStore.deleteDepartment(id);
    if (!success) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Department removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

