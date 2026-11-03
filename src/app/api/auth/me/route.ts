import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, verifySessionToken, VALID_CREDENTIALS } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const result = verifySessionToken(token);

  if (!result.valid) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: VALID_CREDENTIALS.username,
      name: VALID_CREDENTIALS.name,
      role: VALID_CREDENTIALS.role
    }
  });
}

