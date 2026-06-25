'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ClockIcon, MoreHorizontalIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateContactComment } from '@/actions/contacts/update-contact-comment';
import { DeleteContactCommentModal } from '@/components/dashboard/contacts/details/timeline/delete-contact-comment-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useZodForm } from '@/hooks/use-zod-form';
import { getInitials } from '@/lib/utils';
import {
  updateContactCommentSchema,
  type UpdateContactCommentSchema
} from '@/schemas/contacts/update-contact-comment-schema';
import type { ProfileDto } from '@/types/dtos/profile-dto';
import type { CommentTimelineEventDto } from '@/types/dtos/timeline-event-dto';

type ContactTimelineCommentProps = {
  profile: ProfileDto;
  event: CommentTimelineEventDto;
};

export function ContactTimelineComment({
  profile,
  event
}: ContactTimelineCommentProps): React.JSX.Element {
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const form = useZodForm({
    schema: updateContactCommentSchema,
    mode: 'all',
    defaultValues: {
      id: event.id,
      text: event.text
    }
  });
  const canEdit = profile.id === event.sender.id;
  const canSubmit = !form.formState.isLoading && form.formState.isValid;
  const handleEdit = (): void => {
    setIsEditing(true);
  };
  const handleDelete = (): void => {
    NiceModal.show(DeleteContactCommentModal, {
      comment: event
    });
  };
  const handleCancel = (): void => {
    form.reset({ id: event.id, text: event.text });
    setIsEditing(false);
  };
  const onSubmit: SubmitHandler<UpdateContactCommentSchema> = async (
    values
  ) => {
    if (!canSubmit) {
      return;
    }
    const result = await updateContactComment(values);
    if (!result?.serverError && !result?.validationErrors) {
      setIsEditing(false);
    } else {
      toast.error("Couldn't update comment");
    }
  };
  return (
    <>
      <Avatar className="relative mt-3 size-6 flex-none rounded-full">
        <AvatarImage
          src={event.sender.image}
          alt={event.sender.name ?? 'avatar'}
        />
        <AvatarFallback className="size-6 text-[10px]">
          {event.sender.name ? getInitials(event.sender.name) : ''}
        </AvatarFallback>
      </Avatar>
      <div className="mt-3 flex w-full flex-col">
        <div className="mb-1 flex flex-row items-center justify-between">
          <h3 className="text-xs font-medium">
            {event.sender.name}{' '}
            <span className="font-normal text-muted-foreground">
              commented.
            </span>
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="size-6 p-0"
                title="Open menu"
              >
                <MoreHorizontalIcon className="size-4 shrink-0" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!canEdit || isEditing}
                onClick={handleEdit}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="!text-destructive"
                onClick={handleDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-auto flex-row rounded-lg border p-4">
          <div className="flex-1 px-2">
            {isEditing ? (
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="flex flex-col gap-2">
                    <FormField
                      control={form.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Edit comment..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-row items-center justify-end">
                      <div className="flex flex-row gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={form.handleSubmit(onSubmit)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </FormProvider>
            ) : (
              <p className="whitespace-pre-line text-sm">{event.text}</p>
            )}
          </div>
        </div>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="mt-2 flex w-fit items-center space-x-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3 shrink-0" />
              <time suppressHydrationWarning>
                {formatDistanceToNow(event.createdAt, { addSuffix: true })}
              </time>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {format(event.createdAt, 'd MMM yyyy HH:mm:ss')}
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
