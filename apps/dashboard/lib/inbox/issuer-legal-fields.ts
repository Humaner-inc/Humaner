import { workspaceSettingsHref } from '@/constants/workspace-settings-tabs';

export const ISSUER_DATA_HREF = workspaceSettingsHref('data');

export const ISSUER_LEGAL_FIELDS = [
  { key: 'address', label: 'Address' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'taxId', label: 'VAT / Tax ID' },
  { key: 'logoUrl', label: 'Logo' }
] as const;

export type IssuerLegalFieldKey = (typeof ISSUER_LEGAL_FIELDS)[number]['key'];

export type IssuerLegalProfile = Partial<
  Record<IssuerLegalFieldKey, string | null | undefined>
>;

export function missingIssuerLegalFields(
  profile: IssuerLegalProfile,
  options?: { includeLogo?: boolean }
): Array<(typeof ISSUER_LEGAL_FIELDS)[number]> {
  const includeLogo = options?.includeLogo ?? true;
  return ISSUER_LEGAL_FIELDS.filter((field) => {
    if (!includeLogo && field.key === 'logoUrl') return false;
    return !profile[field.key]?.trim();
  });
}
