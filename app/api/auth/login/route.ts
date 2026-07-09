import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
  }

  // Trim both sides: pasted passwords and Vercel env vars commonly carry
  // trailing whitespace/newlines that would silently fail an exact match.
  const submitted = String(password ?? '').trim();
  if (submitted !== sitePassword.trim()) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('hks-auth', 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // 7-day session; remove maxAge for a session-only cookie
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
