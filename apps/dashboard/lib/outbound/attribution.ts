import 'server-only';

// Self-Host: cold outbound waves are Cloud-only — no attribution.
export async function attributeInboundToWave(_input: {
  organizationId: string;
  mailThreadId: string;
  fromAddress: string;
  subject?: string | null;
  bodyText?: string | null;
  aliasId?: string | null;
}): Promise<{ attributed: boolean; waveId?: string }> {
  return { attributed: false };
}

// Self-Host: no outbound waves, so there is no wave tag to filter by.
export async function getOutboundWaveTagId(_input: {
  organizationId: string;
  waveId: string;
}): Promise<string | null> {
  return null;
}
