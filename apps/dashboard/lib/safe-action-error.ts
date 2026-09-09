type SafeActionResultLike = {
  serverError?: string;
  validationErrors?: unknown;
};

function flattenValidationErrors(
  value: unknown,
  path = ''
): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const selfErrors = record._errors;
  if (Array.isArray(selfErrors) && typeof selfErrors[0] === 'string') {
    return path ? `${path}: ${selfErrors[0]}` : selfErrors[0];
  }

  for (const [key, nested] of Object.entries(record)) {
    if (key === '_errors') {
      continue;
    }
    const found = flattenValidationErrors(
      nested,
      path ? `${path}.${key}` : key
    );
    if (found) {
      return found;
    }
  }

  return undefined;
}

const REACT_DIGEST_ERROR =
  /minified React error|#441|Server Components render/i;

export function isReactDigestError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return REACT_DIGEST_ERROR.test(error.message);
}

export function getCaughtActionErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (isReactDigestError(error)) {
    return fallback;
  }
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

export function getSafeActionErrorMessage(
  result: SafeActionResultLike | undefined | null,
  fallback: string
): string {
  const serverError = result?.serverError?.trim();
  if (serverError) {
    return REACT_DIGEST_ERROR.test(serverError) ? fallback : serverError;
  }

  return flattenValidationErrors(result?.validationErrors) ?? fallback;
}
