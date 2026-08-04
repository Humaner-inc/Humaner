export type OrganizationDetailsDto = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Business site from onboarding (never the docs URL). */
  website?: string;
  /** Stored brand logo from onboarding / logo detection. */
  logoUrl?: string;
};
