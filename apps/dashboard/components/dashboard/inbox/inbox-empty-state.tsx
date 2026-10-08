import Link from 'next/link';
import { MailIcon } from '@humaner/shared/icons';

import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Routes } from '@/constants/routes';
import { cn } from '@/lib/utils';

/**
 * Self-Host (OSS) twin of `inbox-empty-state.tsx`.
 *
 * Self-Host has no plan or checkout, so the "upgrade" empty state is the same
 * prompt as the optional one: connect a mailbox. josh renames this file onto
 * `inbox-empty-state.tsx`.
 */
export function InboxOptionalEmptyState({
  title = "Connect mail when you're ready",
  description = 'Connect your mail provider to start using the inbox.',
  showConnect = true
}: {
  title?: string;
  description?: string;
  showConnect?: boolean;
}): React.JSX.Element {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<MailIcon strokeWidth={1.25} />}
    >
      {showConnect ? (
        <Link
          href={Routes.InboxProviders}
          className={cn(buttonVariants({ variant: 'default' }), 'font-mono')}
        >
          Connect a provider
        </Link>
      ) : null}
    </EmptyState>
  );
}

export function InboxUpgradeEmptyState(): React.JSX.Element {
  return <InboxOptionalEmptyState />;
}
