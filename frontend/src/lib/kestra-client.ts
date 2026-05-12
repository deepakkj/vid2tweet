export const KESTRA_BASE_URL = process.env.NEXT_PUBLIC_KESTRA_URL || 'http://localhost:8080';
const KESTRA_USERNAME = process.env.NEXT_PUBLIC_KESTRA_USERNAME || 'admin@kestra.io';
const KESTRA_PASSWORD = process.env.NEXT_PUBLIC_KESTRA_PASSWORD || 'Kestra123';
const NAMESPACE = 'vid2tweet';
const FLOW_ID = 'content-pipeline';

function toBase64(value: string) {
  if (typeof window !== 'undefined') {
    return window.btoa(value);
  }

  return Buffer.from(value).toString('base64');
}

export function getKestraHeaders(headers?: Record<string, string>) {
  return {
    ...headers,
    Authorization: `Basic ${toBase64(`${KESTRA_USERNAME}:${KESTRA_PASSWORD}`)}`,
  };
}

export async function triggerPipeline(youtubeUrl: string): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('youtube_url', youtubeUrl);
  const res = await fetch(`${KESTRA_BASE_URL}/api/v1/main/executions/${NAMESPACE}/${FLOW_ID}`, {
    method: 'POST',
    body: formData,
    headers: getKestraHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger pipeline: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getExecution(executionId: string) {
  const res = await fetch(`${KESTRA_BASE_URL}/api/v1/main/executions/${executionId}`, {
    headers: getKestraHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to get execution: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function resumeExecution(
  executionId: string,
  approved: boolean,
  editedTweet?: string
) {
  const body: Record<string, unknown> = { approved };
  if (editedTweet) body.edited_tweet = editedTweet;
  const res = await fetch(
    `${KESTRA_BASE_URL}/api/v1/main/executions/${executionId}/resume`,
    {
      method: 'POST',
      headers: getKestraHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to resume execution: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function listExecutions() {
  const res = await fetch(
    `${KESTRA_BASE_URL}/api/v1/main/executions?namespace=${NAMESPACE}&flowId=${FLOW_ID}`,
    {
      headers: getKestraHeaders(),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to list executions: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
