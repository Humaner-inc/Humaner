function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY ?? process.env.EMAIL_RESEND_API_KEY;
}

function getAudienceId(): string | undefined {
  return process.env.RESEND_AUDIENCE_ID;
}

async function resendRequest(
  path: string,
  init: RequestInit
): Promise<Response> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw new Error('Resend API key is not configured.');
  }

  return fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init.headers
    }
  });
}

export async function addToResendAudience(email: string): Promise<void> {
  const audienceId = getAudienceId();

  if (!getResendApiKey() || !audienceId) {
    return;
  }

  const response = await resendRequest(`/audiences/${audienceId}/contacts`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      unsubscribed: false
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error: ${response.status} ${body}`);
  }
}

async function patchResendContact(
  path: string,
  email: string
): Promise<'updated' | 'not_found'> {
  const response = await resendRequest(
    `${path}/${encodeURIComponent(email)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ unsubscribed: true })
    }
  );

  if (response.status === 404) {
    return 'not_found';
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error: ${response.status} ${body}`);
  }

  return 'updated';
}

export async function unsubscribeWaitlistContact(
  email: string
): Promise<{ audienceUpdated: boolean; globalUpdated: boolean }> {
  const audienceId = getAudienceId();

  if (!getResendApiKey()) {
    throw new Error('Resend API key is not configured.');
  }

  const [audienceResult, globalResult] = await Promise.all([
    audienceId
      ? patchResendContact(`/audiences/${audienceId}/contacts`, email)
      : Promise.resolve('not_found' as const),
    patchResendContact('/contacts', email)
  ]);

  return {
    audienceUpdated: audienceResult === 'updated',
    globalUpdated: globalResult === 'updated'
  };
}
