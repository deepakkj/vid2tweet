import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('tw_access_token')?.value;
  const username = request.cookies.get('tw_username')?.value;

  if (!token) {
    return NextResponse.json({ connected: false });
  }
  return NextResponse.json({ connected: true, username: username ?? 'connected' });
}
