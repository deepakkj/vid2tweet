import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CALLBACK_URL = `${APP_URL}/api/auth/twitter/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?auth_error=denied', APP_URL));
  }

  const savedState = request.cookies.get('tw_oauth_state')?.value;
  const codeVerifier = request.cookies.get('tw_code_verifier')?.value;

  if (!code || !state || state !== savedState || !codeVerifier) {
    return NextResponse.redirect(new URL('/?auth_error=invalid_state', APP_URL));
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CALLBACK_URL,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Twitter token exchange failed:', err);
    return NextResponse.redirect(new URL('/?auth_error=token_exchange', APP_URL));
  }

  const { access_token, refresh_token, expires_in } = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  // Fetch the connected user's screen name for display
  let username = 'connected';
  try {
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (userRes.ok) {
      const { data } = (await userRes.json()) as { data: { username: string } };
      username = data.username;
    }
  } catch {
    // Non-fatal — username is cosmetic only
  }

  const tokenMaxAge = expires_in ?? 7200;
  const response = NextResponse.redirect(new URL('/', APP_URL));

  response.cookies.set('tw_access_token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: tokenMaxAge,
    sameSite: 'lax',
    path: '/',
  });

  // Non-httpOnly so the UI can read the username without an extra API call
  response.cookies.set('tw_username', username, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: tokenMaxAge,
    sameSite: 'lax',
    path: '/',
  });

  if (refresh_token) {
    response.cookies.set('tw_refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      path: '/',
    });
  }

  // Clean up the short-lived OAuth flow cookies
  response.cookies.delete('tw_oauth_state');
  response.cookies.delete('tw_code_verifier');

  return response;
}
