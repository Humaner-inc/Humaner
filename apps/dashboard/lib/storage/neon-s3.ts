import 'server-only';

import {
  GetObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function isNeonObjectStorageConfigured(): boolean {
  return Boolean(
    env('AWS_ACCESS_KEY_ID') &&
      env('AWS_SECRET_ACCESS_KEY') &&
      env('AWS_ENDPOINT_URL_S3')
  );
}

let cachedClient: S3Client | null = null;

export function getNeonS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const accessKeyId = env('AWS_ACCESS_KEY_ID');
  const secretAccessKey = env('AWS_SECRET_ACCESS_KEY');
  const endpoint = env('AWS_ENDPOINT_URL_S3');

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error('Neon object storage is not configured');
  }

  cachedClient = new S3Client({
    region: env('AWS_REGION') || 'us-east-2',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  });

  return cachedClient;
}

export async function putNeonObject(input: {
  bucket: string;
  key: string;
  body: Buffer | string;
  contentType: string;
}): Promise<void> {
  await getNeonS3Client().send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType
    })
  );
}

export async function createNeonSignedPutUrl(input: {
  bucket: string;
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  return getSignedUrl(
    getNeonS3Client(),
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      ContentType: input.contentType
    }),
    { expiresIn: input.expiresIn ?? 300 }
  );
}

export async function createNeonSignedGetUrl(input: {
  bucket: string;
  key: string;
  expiresIn?: number;
}): Promise<string> {
  return getSignedUrl(
    getNeonS3Client(),
    new GetObjectCommand({
      Bucket: input.bucket,
      Key: input.key
    }),
    { expiresIn: input.expiresIn ?? 3600 }
  );
}

const corsReady = new Set<string>();

function ticketCorsOrigins(): string[] {
  const origins = [
    env('NEXT_PUBLIC_APP_URL'),
    env('NEXT_PUBLIC_BASE_URL'),
    env('AUTH_URL')
  ].filter((value): value is string => Boolean(value));

  return origins.length > 0
    ? [...new Set(origins.map((origin) => origin.replace(/\/$/, '')))]
    : ['*'];
}

/** Browser PUT of bug-report screenshots needs CORS on the Tickets bucket. */
export async function ensureNeonBucketCors(bucket: string): Promise<void> {
  if (corsReady.has(bucket)) {
    return;
  }

  try {
    await getNeonS3Client().send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'HEAD'],
              AllowedOrigins: ticketCorsOrigins(),
              ExposeHeaders: ['ETag', 'Content-Type'],
              MaxAgeSeconds: 3600
            }
          ]
        }
      })
    );
    corsReady.add(bucket);
  } catch (error) {
    console.error('[storage] Bucket CORS update failed', error);
  }
}
