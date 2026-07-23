import { ShieldCheck } from '@humaner/shared/icons';

export function MfaRecommendedBanner(): React.JSX.Element {
  return (
    <div className="mb-6 flex items-start gap-3 border border-[#e1ccaf]/40 bg-[#e1ccaf]/10 px-4 py-3 text-sm text-foreground">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#070607]" />
      <div>
        <p className="font-medium">
          Two-factor authentication is highly recommended
        </p>
        <p className="mt-0.5 text-muted-foreground">
          Workspace owners and platform admins should enable an authenticator
          app to protect account access. This is optional, but strongly
          encouraged.
        </p>
      </div>
    </div>
  );
}
