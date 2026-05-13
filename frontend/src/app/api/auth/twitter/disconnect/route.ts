import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('tw_access_token');
  response.cookies.delete('tw_username');
  response.cookies.delete('tw_refresh_token');
  return response;
}
