'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, CopyIcon } from '@humaner/shared/icons';
import type { IndustryType, TargetAudience } from '@prisma/client';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateOrganizationDetails } from '@/actions/organization/update-organization-details';
import { BusinessLogo } from '@/components/dashboard/business-logo';
import { AudienceTag } from '@/components/dashboard/home/audience-tag';
import { IndustryTag } from '@/components/dashboard/home/industry-tag';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  updateOrganizationDetailsSchema,
  type UpdateOrganizationDetailsSchema
} from '@/schemas/organization/update-organization-details-schema';
import type { OrganizationDetailsDto } from '@/types/dtos/organization-details-dto';

export type OrganizationDetailsCardProps = CardProps & {
  details: OrganizationDetailsDto;
  industry?: IndustryType | null;
  targetAudience?: TargetAudience | null;
  /** Workspace page: hide header. Settings: logo block with description. */
  brandHeader?: 'logo' | 'none';
};

export function OrganizationDetailsCard({
  details,
  industry = null,
  targetAudience = null,
  brandHeader = 'logo',
  ...props
}: OrganizationDetailsCardProps): React.JSX.Element {
  const router = useRouter();
  const methods = useZodForm({
    schema: updateOrganizationDetailsSchema,
    mode: 'onSubmit',
    defaultValues: {
      name: details.name ?? '',
      address: details.address ?? '',
      phone: details.phone ?? '',
      email: details.email ?? '',
      website: details.website ?? ''
    }
  });
  const canSubmit = !methods.formState.isSubmitting;
  const watchedName = methods.watch('name');
  const watchedWebsite = methods.watch('website');
  const copyToClipboard = useCopyToClipboard();
  const [copiedWorkspaceId, setCopiedWorkspaceId] = React.useState(false);
  const onSubmit: SubmitHandler<UpdateOrganizationDetailsSchema> = async (
    values
  ) => {
    if (!canSubmit) {
      return;
    }
    const result = await updateOrganizationDetails(values);
    if (!result?.serverError && !result?.validationErrors) {
      const websiteRescanned = Boolean(result?.data?.websiteRescanned);
      const nextName = result?.data?.name;
      if (typeof nextName === 'string' && nextName !== values.name) {
        methods.setValue('name', nextName, { shouldDirty: false });
      }
      toast.success(
        websiteRescanned
          ? 'Website updated — brand logo and colors rescanned'
          : 'Organization details updated'
      );
      if (websiteRescanned) {
        router.refresh();
      }
    } else {
      toast.error("Couldn't update organization details");
    }
  };
  return (
    <FormProvider {...methods}>
      <Card {...props}>
        <CardContent className="pt-6">
          <form
            className="space-y-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            {brandHeader === 'logo' ? (
              <div className="relative rounded-none border border-border/60 bg-secondary/30 p-4">
                <div className="absolute right-3 top-3">
                  <IndustryTag
                    industry={industry}
                    editable
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="size-14 shrink-0 overflow-hidden rounded-none border border-border/60 bg-background">
                    {details.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={details.logoUrl}
                        alt={watchedName ? `${watchedName} logo` : 'Brand logo'}
                        className="size-full object-cover"
                      />
                    ) : (
                      <BusinessLogo
                        website={watchedWebsite}
                        name={watchedName}
                        size={96}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="subsection-title truncate">
                      {watchedName || details.name || 'Organization'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <AudienceTag targetAudience={targetAudience} />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <FormField
              control={methods.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel required>Organization name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      maxLength={255}
                      required
                      autoComplete="organization"
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex w-full flex-col gap-2">
              <FormLabel>Workspace ID</FormLabel>
              <FormDescription>
                Share with teammates who sign up as team members without an
                invite.
              </FormDescription>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={details.id}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Copy workspace ID"
                  onClick={async () => {
                    await copyToClipboard(details.id);
                    setCopiedWorkspaceId(true);
                    toast.success('Workspace ID copied');
                    window.setTimeout(() => setCopiedWorkspaceId(false), 1500);
                  }}
                >
                  {copiedWorkspaceId ? (
                    <CheckIcon className="size-4 text-emerald-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <FormField
              control={methods.control}
              name="address"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      maxLength={255}
                      autoComplete="street-address"
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      maxLength={32}
                      autoComplete="tel"
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      maxLength={255}
                      autoComplete="email"
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="website"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      maxLength={2000}
                      autoComplete="url"
                      placeholder="https://yourcompany.com"
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </CardContent>
        <Separator />
        <CardFooter className="flex w-full justify-end pt-6">
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
            onClick={methods.handleSubmit(onSubmit)}
          >
            Save
          </Button>
        </CardFooter>
      </Card>
    </FormProvider>
  );
}
