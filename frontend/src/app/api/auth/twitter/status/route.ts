import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('tw_access_token')?.value;
  let username = request.cookies.get('tw_username')?.value ?? '';

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  // If the stored username is stale (old hardcoded fallback), fetch the real one.
  if (!username || username === 'connected') {
    try {
      const userRes = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const { data } = (await userRes.json()) as { data: { username: string } };
        username = data.username;
      }
    } catch {
      // Non-fatal
    }
  }

  const response = NextResponse.json({ connected: true, username });

  // Overwrite the stale cookie with the real username so subsequent calls don't re-fetch.
  if (username && username !== 'connected') {
    response.cookies.set('tw_username', username, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}
