import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(req: Request) {
  try {
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ error: 'Phone number and message are required' }, { status: 400 });
    }

    const result = dataStore.simulateIncomingWhatsApp(phoneNumber, message);
    const replyRecord = dataStore.recordEmployeeWhatsAppReply(phoneNumber, message);

    return NextResponse.json({
      success: true,
      ...result,
      task_updated: replyRecord.task ? replyRecord.task.task_code : null,
      sheet_action: replyRecord.actionTaken
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

