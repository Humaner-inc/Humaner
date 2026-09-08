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

export function getSafeActionErrorMessage(
  result: SafeActionResultLike | undefined | null,
  fallback: string
): string {
  const serverError = result?.serverError?.trim();
  if (serverError) {
    return serverError;
  }

  return flattenValidationErrors(result?.validationErrors) ?? fallback;
}
