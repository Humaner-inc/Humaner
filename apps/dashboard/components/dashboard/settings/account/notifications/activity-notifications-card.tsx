'use client';

import * as React from 'react';
import { FormProvider, useWatch, type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateActivityNotifications } from '@/actions/account/update-activity-notifications';
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
  FormLabel
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AppInfo } from '@/constants/app-info';
import { useZodForm } from '@/hooks/use-zod-form';
import { dashboardRadiusClassName } from '@/lib/dashboard/surface-styles';
import { isOssDeployment } from '@/lib/deployment-mode';
import { cn } from '@/lib/utils';
import {
  updateActivityNotificationsSchema,
  type UpdateActivityNotificationsSchema
} from '@/schemas/account/update-activity-notifications-schema';
import type {
  ActivityNotificationMailTagOption,
  ActivityNotificationsDto,
  DeskNotificationUrgency
} from '@/types/dtos/activity-notifications-dto';

const oss = isOssDeployment();

const DESK_URGENCY_OPTIONS: {
  value: DeskNotificationUrgency;
  label: string;
}[] = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' }
];

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FilterChip({
  selected,
  disabled,
  onClick,
  children,
  swatch
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  swatch?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 border px-2.5 text-xs font-medium transition-colors',
        dashboardRadiusClassName,
        selected
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      {swatch ? (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: swatch }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}

export type ActivityNotificationsCardProps = CardProps & {
  settings: ActivityNotificationsDto;
  mailTags: ActivityNotificationMailTagOption[];
};

export function ActivityNotificationsCard({
  settings,
  mailTags,
  ...other
}: ActivityNotificationsCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updateActivityNotificationsSchema,
    mode: 'onSubmit',
    defaultValues: settings
  });

  const deskInApp = useWatch({ control: methods.control, name: 'desk.inApp' });
  const deskEmail = useWatch({ control: methods.control, name: 'desk.email' });
  const mailInApp = useWatch({ control: methods.control, name: 'mail.inApp' });
  const mailEmail = useWatch({ control: methods.control, name: 'mail.email' });

  const showDeskFilters = Boolean(deskInApp || deskEmail);
  const showMailFilters = Boolean(mailInApp || mailEmail);
  const canSubmit = !methods.formState.isSubmitting;

  const onSubmit: SubmitHandler<UpdateActivityNotificationsSchema> = async (
    values
  ) => {
    if (!canSubmit) {
      return;
    }
    const result = await updateActivityNotifications(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Activity notifications updated');
    } else {
      toast.error("Couldn't update activity notifications");
    }
  };

  return (
    <FormProvider {...methods}>
      <Card {...other}>
        <CardContent className="pt-6">
          <form
            className="space-y-6"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {oss ? AppInfo.HELPDESK_LABEL : 'Human Desk'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tickets assigned or needing attention, filtered by urgency.
                </p>
              </div>

              <FormField
                control={methods.control}
                name="desk.inApp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>In the app</FormLabel>
                      <FormDescription>
                        Show desk tickets in your notification drawer.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={methods.formState.isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="desk.email"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Email</FormLabel>
                      <FormDescription>
                        Receive email when matching desk tickets appear.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={methods.formState.isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {showDeskFilters ? (
                <FormField
                  control={methods.control}
                  name="desk.urgencies"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Urgency</FormLabel>
                      <FormDescription>
                        Only notify for tickets at these urgency levels.
                      </FormDescription>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {DESK_URGENCY_OPTIONS.map((option) => (
                            <FilterChip
                              key={option.value}
                              selected={field.value.includes(option.value)}
                              disabled={methods.formState.isSubmitting}
                              onClick={() =>
                                field.onChange(
                                  toggleInList(field.value, option.value)
                                )
                              }
                            >
                              {option.label}
                            </FilterChip>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            {!oss ? (
              <>
                <Separator />

                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Mail</p>
                    <p className="text-sm text-muted-foreground">
                      Urgent threads only — not every inbound mail.
                    </p>
                  </div>

                  <FormField
                    control={methods.control}
                    name="mail.inApp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>In the app</FormLabel>
                          <FormDescription>
                            Show high-urgency mail in your notification panel.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={methods.formState.isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="mail.email"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Email</FormLabel>
                          <FormDescription>
                            Receive email for matching inbox activity.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={methods.formState.isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {showMailFilters ? (
                    <FormField
                      control={methods.control}
                      name="mail.tagIds"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Tags</FormLabel>
                          <FormDescription>
                            Leave none selected to notify for all tags. Select
                            tags to narrow what you hear about.
                          </FormDescription>
                          <FormControl>
                            {mailTags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {mailTags.map((tag) => (
                                  <FilterChip
                                    key={tag.id}
                                    selected={field.value.includes(tag.id)}
                                    disabled={methods.formState.isSubmitting}
                                    swatch={tag.color}
                                    onClick={() =>
                                      field.onChange(
                                        toggleInList(field.value, tag.id)
                                      )
                                    }
                                  >
                                    {tag.name}
                                  </FilterChip>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No mail tags yet. Create tags in Inbox to filter
                                here.
                              </p>
                            )}
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ) : null}
                </div>
              </>
            ) : null}
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
