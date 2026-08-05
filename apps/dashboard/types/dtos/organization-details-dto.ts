export type OrganizationDetailsDto = {
  /** Workspace ID teammates use when requesting access without an invite. */
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Business site from onboarding (never the docs URL). */
  website?: string;
  /** Stored brand logo from onboarding / logo detection. */
  logoUrl?: string;
};
