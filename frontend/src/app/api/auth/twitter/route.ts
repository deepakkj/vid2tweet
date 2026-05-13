import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CALLBACK_URL = `${APP_URL}/api/auth/twitter/callback`;

export async function GET() {
  if (!CLIENT_ID) {
    return NextResponse.json(
      { error: 'TWITTER_CLIENT_ID is not configured' },
      { status: 503 }
    );
  }

  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'tweet.write users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  const response = NextResponse.redirect(authUrl);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes for the OAuth handshake
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set('tw_oauth_state', state, cookieOpts);
  response.cookies.set('tw_code_verifier', codeVerifier, cookieOpts);

  return response;
}
