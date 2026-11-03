import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const websites = dataStore.getWebsites(clientId || undefined);
  return NextResponse.json(websites);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.websiteName || !body.domain || !body.clientId) {
      return NextResponse.json({ error: 'Client, Website name and domain are required' }, { status: 400 });
    }

    const client = dataStore.getClients().find(c => c.id === body.clientId);

    const newWeb = dataStore.addWebsite({
      client_id: body.clientId,
      client_name: client?.company_name || 'Client',
      website_name: body.websiteName,
      domain: body.domain,
      website_type: body.websiteType || 'corporate',
      platform: body.platform || 'WordPress',
      assigned_department_id: body.departmentId || 'dept-1',
      responsible_developer_id: body.developerId || 'emp-1',
      seo_responsible_id: body.seoId || 'emp-3',
      designer_id: body.designerId || 'emp-2',
      website_manager_id: 'emp-mgr',
      current_status: 'live',
      hosting_reference: body.hostingReference || 'Cloud-Standard-Node-01',
      launch_date: body.launchDate || new Date().toISOString().split('T')[0]
    });

    return NextResponse.json(newWeb, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

