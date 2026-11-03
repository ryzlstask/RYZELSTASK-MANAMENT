import { NextResponse } from 'next/server';
import { VALID_CREDENTIALS, createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (
      username.trim() !== VALID_CREDENTIALS.username ||
      password !== VALID_CREDENTIALS.password
    ) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token = createSessionToken(VALID_CREDENTIALS.username);

    const response = NextResponse.json({
      success: true,
      user: {
        username: VALID_CREDENTIALS.username,
        name: VALID_CREDENTIALS.name,
        role: VALID_CREDENTIALS.role
      }
    });

    // Set secure HTTP-only browser session cookie (clears automatically when tab/browser session closes)
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}

