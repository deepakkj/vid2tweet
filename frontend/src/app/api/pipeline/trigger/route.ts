import { NextRequest, NextResponse } from 'next/server';

const KESTRA_BASE_URL = process.env.NEXT_PUBLIC_KESTRA_URL || 'http://localhost:8080';
const KESTRA_USERNAME = process.env.NEXT_PUBLIC_KESTRA_USERNAME || 'admin@kestra.io';
const KESTRA_PASSWORD = process.env.NEXT_PUBLIC_KESTRA_PASSWORD || 'Kestra123';

function kestraAuth(): string {
  return `Basic ${Buffer.from(`${KESTRA_USERNAME}:${KESTRA_PASSWORD}`).toString('base64')}`;
}

export async function POST(request: NextRequest) {
  const { youtube_url, youtube_cookies, dry_run } = (await request.json()) as {
    youtube_url: string;
    youtube_cookies: string;
    dry_run?: boolean;
  };

  // Read the Twitter OAuth 2.0 token server-side (httpOnly cookie — never exposed to browser)
  const oauth2Token = request.cookies.get('tw_access_token')?.value;

  const formData = new FormData();
  formData.append('youtube_url', youtube_url);
  formData.append('youtube_cookies', youtube_cookies);
  formData.append('dry_run', String(dry_run ?? false));
  if (oauth2Token) {
    formData.append('twitter_oauth2_token', oauth2Token);
  }

  const res = await fetch(
    `${KESTRA_BASE_URL}/api/v1/main/executions/vid2tweet/content-pipeline`,
    {
      method: 'POST',
      headers: { Authorization: kestraAuth() },
      body: formData,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json(
      { error: `Failed to trigger pipeline: ${res.status} ${errorText}` },
      { status: res.status }
    );
  }

  return NextResponse.json(await res.json());
}
