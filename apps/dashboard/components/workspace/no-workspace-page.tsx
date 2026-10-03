'use client';

import * as React from 'react';
import { assignTrustedNavigation } from '@humaner/shared/urls';
import { motion } from 'motion/react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { logOut } from '@/actions/auth/log-out';
import { createWorkspace } from '@/actions/workspaces/create-workspace';
import { requestWorkspaceAccess } from '@/actions/workspaces/request-workspace-access';
import {
  authDestructiveMessageClassName,
  authGlassCardGlowClassName,
  authInputClassName,
  authLabelClassName,
  authMutedTextClassName,
  authOutlineButtonClassName,
  authPageTitleClassName
} from '@/components/auth/auth-form-styles';
import { DangerZoneCard } from '@/components/dashboard/settings/account/profile/danger-zone-card';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { GrainAmbient } from '@/components/ui/grain-ambient';
import { Input } from '@/components/ui/input';
import { AppInfo } from '@/constants/app-info';
import { Routes } from '@/constants/routes';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn } from '@/lib/utils';
import {
  createWorkspaceSchema,
  type CreateWorkspaceSchema
} from '@/schemas/workspaces/workspace-schemas';

const requestAccessSchema = z.object({
  workspaceId: z.string().trim().uuid('Enter a valid workspace ID.')
});

type RequestAccessSchema = z.infer<typeof requestAccessSchema>;

type DayPeriod = 'morning' | 'afternoon' | 'evening';

const pillButtonClassName =
  'relative min-h-9 flex-1 rounded-[14px] border-0 px-2 py-2 font-mono text-[11px] font-medium tracking-normal outline-none transition-colors focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#e0e1df]/40 sm:min-h-10 sm:text-xs';

const glassCardClassName =
  'relative overflow-hidden rounded-lg border border-white/[0.12] bg-muted/20 text-[#f2f2f2] shadow-[0_32px_80px_-20px_rgb(0_0_0_/_0.85),inset_0_1px_0_rgb(255_255_255_/_0.08)]';

const inputClassName = cn(authInputClassName, 'rounded-lg');

function getDayPeriod(date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

function getDayPeriodGreeting(period: DayPeriod): string {
  if (period === 'morning') return 'Good morning';
  if (period === 'afternoon') return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? '';
}

function SunIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function HalfMoonIcon({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function DayPeriodIcon({ period }: { period: DayPeriod }): React.JSX.Element {
  const icon =
    period === 'evening' ? (
      <HalfMoonIcon className="size-4 text-[#e0e1df] sm:size-[1.125rem]" />
    ) : (
      <SunIcon className="size-4 text-[#e0e1df] sm:size-[1.125rem]" />
    );

  return (
    <motion.span
      className="inline-flex"
      initial={{
        opacity: 0,
        scale: 0.35,
        rotate: period === 'evening' ? -28 : -40
      }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 18,
        mass: 0.7,
        delay: 0.12
      }}
    >
      {icon}
    </motion.span>
  );
}

export type NoWorkspacePageProps = {
  email: string;
  name: string;
  pendingJoinRequest?: {
    organizationName: string;
  } | null;
};

export function NoWorkspacePage({
  email,
  name,
  pendingJoinRequest
}: NoWorkspacePageProps): React.JSX.Element {
  const [mode, setMode] = React.useState<'create' | 'join'>('join');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Resolve immediately so we never flash a "Welcome" placeholder.
  const [dayPeriod, setDayPeriod] = React.useState<DayPeriod>(() =>
    getDayPeriod()
  );

  React.useEffect(() => {
    const apply = (): void => {
      setDayPeriod(getDayPeriod());
    };
    apply();
    const intervalId = window.setInterval(apply, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const firstName = getFirstName(name);
  const greeting = getDayPeriodGreeting(dayPeriod);
  /** Last word before the name — icon anchors to its top-right. */
  const greetingParts = greeting.split(/\s+/);
  const greetingAnchorWord = greetingParts.at(-1) ?? greeting;
  const greetingLead =
    greetingParts.length > 1 ? greetingParts.slice(0, -1).join(' ') : null;

  const createMethods = useZodForm({
    schema: createWorkspaceSchema,
    mode: 'onSubmit',
    defaultValues: { website: '' }
  });

  const joinMethods = useZodForm({
    schema: requestAccessSchema,
    mode: 'onSubmit',
    defaultValues: { workspaceId: '' }
  });

  const onCreate: SubmitHandler<CreateWorkspaceSchema> = async (values) => {
    setIsSubmitting(true);
    const result = await createWorkspace(values);
    setIsSubmitting(false);

    if (result?.serverError) {
      toast.error(result.serverError);
      return;
    }
    if (result?.validationErrors) {
      toast.error("Couldn't create workspace");
      return;
    }

    toast.success('Workspace created');
    assignTrustedNavigation(result?.data?.redirectTo ?? Routes.Onboarding);
  };

  const onJoin: SubmitHandler<RequestAccessSchema> = async (values) => {
    setIsSubmitting(true);
    const result = await requestWorkspaceAccess(values);
    setIsSubmitting(false);

    if (result?.serverError) {
      toast.error(result.serverError);
      return;
    }
    if (result?.validationErrors) {
      toast.error("Couldn't request access");
      return;
    }

    toast.success(
      `Request sent to ${result?.data?.organizationName ?? 'workspace'}`
    );
    window.location.reload();
  };

  const handleLogOut = async (): Promise<void> => {
    const result = await logOut({ redirect: false });
    if (!result?.serverError && !result?.validationErrors) {
      assignTrustedNavigation(Routes.Login);
      return;
    }
    toast.error("Couldn't log out");
  };

  return (
    <div className="relative flex min-h-screen bg-[#0A0D0D] text-[#f2f2f2]">
      <GrainAmbient className="fixed inset-0 z-0" />

      <header className="absolute inset-x-0 top-0 z-20 flex justify-center px-6 pt-6 sm:pt-8">
        <h1 className={cn(authPageTitleClassName, 'text-4xl sm:text-5xl')}>
          {AppInfo.APP_NAME}
        </h1>
      </header>

      <main className="relative z-10 flex min-h-screen w-full flex-col items-center px-6 pb-12 pt-[4.75rem] sm:pt-[5.25rem]">
        <div className="flex w-full max-w-md flex-1 flex-col justify-center gap-8">
          <div className="flex flex-col items-center space-y-1.5 text-center">
            <p
              className="font-fellix text-lg font-medium tracking-tight text-[#f2f2f2] sm:text-xl"
              suppressHydrationWarning
            >
              {greetingLead ? <>{greetingLead} </> : null}
              <span className="relative inline-block">
                {greetingAnchorWord}
                <span className="pointer-events-none absolute -right-1.5 -top-2.5 sm:-right-2 sm:-top-3">
                  <DayPeriodIcon period={dayPeriod} />
                </span>
              </span>
              {firstName ? <>, {firstName}</> : null}
            </p>
            <p className="font-mono text-sm text-white/25">
              Signed in as {email}
            </p>
            <p
              className={cn(authMutedTextClassName, 'text-sm leading-relaxed')}
            >
              You haven&apos;t joined a mailbox yet. Request access with a
              workspace ID, or create one.
            </p>
          </div>

          <div className={cn(glassCardClassName, 'p-0')}>
            <div
              className={authGlassCardGlowClassName}
              aria-hidden
            />

            <div
              className="relative flex border-b border-white/[0.08] bg-white/[0.04]"
              role="group"
              aria-label="Workspace action"
            >
              {(
                [
                  { value: 'join' as const, label: 'Join a mailbox' },
                  { value: 'create' as const, label: 'Create mailbox' }
                ] as const
              ).map((option, index) => {
                const selected = mode === option.value;
                return (
                  <React.Fragment key={option.value}>
                    {index > 0 ? (
                      <div
                        className="w-px shrink-0 bg-white/[0.08]"
                        aria-hidden
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setMode(option.value)}
                      className={cn(
                        pillButtonClassName,
                        selected
                          ? 'bg-[#f2f2f2] text-[#0A0D0D] hover:bg-white hover:text-[#0A0D0D]'
                          : 'bg-transparent text-white/40 hover:bg-white/[0.06] hover:text-white/70'
                      )}
                    >
                      {option.label}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="relative space-y-5 p-5 sm:p-6">
              {mode === 'join' ? (
                <FormProvider {...joinMethods}>
                  <form
                    className="flex flex-col gap-5"
                    onSubmit={joinMethods.handleSubmit(onJoin)}
                  >
                    <div className="space-y-1">
                      <p className="font-fellix text-base font-medium text-[#f2f2f2]">
                        Request mailbox access
                      </p>
                      <p className={cn(authMutedTextClassName, 'text-xs')}>
                        {pendingJoinRequest
                          ? `An admin is reviewing your access to ${pendingJoinRequest.organizationName}'s mailbox.`
                          : 'Paste the workspace ID from Organization settings.'}
                      </p>
                    </div>

                    <FormField
                      control={joinMethods.control}
                      name="workspaceId"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                          <FormLabel
                            required
                            className={authLabelClassName}
                          >
                            Workspace ID
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="off"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              disabled={isSubmitting}
                              className={cn(inputClassName, 'font-mono')}
                            />
                          </FormControl>
                          <FormMessage
                            className={authDestructiveMessageClassName}
                          />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          authOutlineButtonClassName,
                          'rounded-lg sm:flex-1'
                        )}
                        onClick={() => void handleLogOut()}
                        disabled={isSubmitting}
                      >
                        Log out
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        className={cn(
                          authOutlineButtonClassName,
                          'rounded-lg sm:flex-1'
                        )}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        Request access
                      </Button>
                    </div>
                  </form>
                </FormProvider>
              ) : (
                <FormProvider {...createMethods}>
                  <form
                    className="flex flex-col gap-5"
                    onSubmit={createMethods.handleSubmit(onCreate)}
                  >
                    <div className="space-y-1">
                      <p className="font-fellix text-base font-medium text-[#f2f2f2]">
                        Create a mailbox
                      </p>
                      <p className={cn(authMutedTextClassName, 'text-xs')}>
                        We&apos;ll use your business website to set up the
                        workspace mailbox.
                      </p>
                    </div>

                    <FormField
                      control={createMethods.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                          <FormLabel
                            required
                            className={authLabelClassName}
                          >
                            Business website
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="https://yourcompany.com"
                              disabled={isSubmitting}
                              className={inputClassName}
                            />
                          </FormControl>
                          <FormMessage
                            className={authDestructiveMessageClassName}
                          />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          authOutlineButtonClassName,
                          'rounded-lg sm:flex-1'
                        )}
                        onClick={() => void handleLogOut()}
                        disabled={isSubmitting}
                      >
                        Log out
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        className={cn(
                          authOutlineButtonClassName,
                          'rounded-lg sm:flex-1'
                        )}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        Create mailbox
                      </Button>
                    </div>
                  </form>
                </FormProvider>
              )}
            </div>
          </div>

          <DangerZoneCard
            email={email}
            isOwner={false}
            className="rounded-lg border-red-500/35 bg-red-500/10 text-[#f2f2f2] [&_.subsection-title]:text-[#f2f2f2] [&_p]:text-white/55"
          />
        </div>
      </main>
    </div>
  );
}
