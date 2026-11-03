import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  return NextResponse.json(dataStore.getEmployees());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.full_name || !body.phone_number) {
      return NextResponse.json({ error: 'Full name and WhatsApp phone number are required' }, { status: 400 });
    }

    const newEmp = dataStore.addEmployee({
      full_name: body.full_name,
      email: body.email || `${body.full_name.toLowerCase().replace(/\s+/g, '.')}@ryzels.com`,
      phone_number: body.phone_number.startsWith('+') ? body.phone_number : `+${body.phone_number}`,
      role: body.role || 'employee',
      department_id: body.department_id || 'dept-1',
      position: body.position || 'Operations Specialist',
      current_workload_hours: Number(body.current_workload_hours || 0),
      max_weekly_capacity_hours: Number(body.max_weekly_capacity_hours || 40),
      status: 'active',
      skills: body.skills || [
        { id: `sk-${Date.now()}`, employee_id: '', skill_name: 'Operations & Execution', proficiency_level: 'advanced', years_experience: 3, is_primary: true }
      ]
    });

    return NextResponse.json(newEmp, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const updated = dataStore.updateEmployee(body.id, {
      full_name: body.full_name,
      email: body.email,
      phone_number: body.phone_number?.startsWith('+') ? body.phone_number : `+${body.phone_number}`,
      department_id: body.department_id,
      position: body.position,
      max_weekly_capacity_hours: Number(body.max_weekly_capacity_hours || 40),
      status: body.status || 'active',
      skills: body.skills
    });

    if (!updated) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const ok = dataStore.deleteEmployee(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

