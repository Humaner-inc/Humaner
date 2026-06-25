'use client';

import * as React from 'react';
import EmojiPicker, {
  EmojiStyle,
  SkinTones,
  Theme,
  type EmojiClickData
} from 'emoji-picker-react';
import { SmileIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { addContactComment } from '@/actions/contacts/add-contact-comment';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, type CardProps } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormProvider
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useZodForm } from '@/hooks/use-zod-form';
import { cn, getInitials } from '@/lib/utils';
import {
  AddContactCommentSchema,
  addContactCommentSchema
} from '@/schemas/contacts/add-contact-comment-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type ContactTimelineAddCommentCardProps = CardProps & {
  profile: ProfileDto;
  contact: ContactDto;
  showComments: boolean;
  onShowCommentsChange: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ContactTimelineAddComment({
  profile,
  contact,
  className,
  showComments,
  onShowCommentsChange,
  ...other
}: ContactTimelineAddCommentCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: addContactCommentSchema,
    mode: 'all',
    defaultValues: {
      contactId: contact.id,
      text: ''
    }
  });
  const canSubmit =
    !methods.formState.isSubmitting && methods.formState.isValid;
  const handleEmojiSelected = (
    emojiData: EmojiClickData,
    _event: MouseEvent
  ) => {
    methods.setValue('text', methods.getValues('text') + emojiData.emoji, {
      shouldValidate: true
    });
  };
  const onSubmit: SubmitHandler<AddContactCommentSchema> = async (
    values
  ): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    const result = await addContactComment({
      contactId: values.contactId,
      text: values.text
    });
    if (!result?.serverError && !result?.validationErrors) {
      methods.reset(methods.formState.defaultValues);
    } else {
      toast.error("Couldn't add comment");
    }
  };
  return (
    <>
      <Avatar
        title={profile.name}
        className="relative ml-0.5 mt-3 size-6 flex-none rounded-full"
      >
        <AvatarImage
          src={profile.image}
          alt="avatar"
        />
        <AvatarFallback className="size-6 text-[10px]">
          {getInitials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-auto flex-col gap-2">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Card
              className={cn('rounded-lg', className)}
              {...other}
            >
              <input
                type="hidden"
                className="hidden"
                {...methods.register('contactId')}
              />
              <FormField
                control={methods.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex w-full items-center px-4 py-2">
                    <FormControl>
                      <Input
                        type="text"
                        className="w-full flex-1 border-0 shadow-none outline-0"
                        placeholder="Leave a comment..."
                        maxLength={2000}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Separator />
              <div className="flex items-center justify-between px-3 py-1 text-muted-foreground">
                <div className="flex flex-row gap-2">
                  <Popover>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full"
                          >
                            <SmileIcon className="size-5 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Add emoji</TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-fit border-0 p-0">
                      <style
                        jsx
                        global
                      >
                        {`
                          .EmojiPickerReact {
                            --epr-emoji-size: 20px !important;
                          }
                        `}
                      </style>
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelected}
                        autoFocusSearch={false}
                        theme={Theme.LIGHT}
                        previewConfig={{ showPreview: false }}
                        skinTonesDisabled
                        defaultSkinTone={SkinTones.NEUTRAL}
                        emojiStyle={EmojiStyle.NATIVE}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={!canSubmit}
                >
                  Post
                </Button>
              </div>
            </Card>
          </form>
        </FormProvider>
        <div className="flex items-center justify-end">
          <div className="flex flex-row items-center gap-1.5 p-1">
            <Checkbox
              id="show-comment"
              checked={showComments}
              onCheckedChange={() => onShowCommentsChange((prev) => !prev)}
            />
            <Label
              htmlFor="show-comment"
              className="cursor-pointer text-xs"
            >
              Show comments
            </Label>
          </div>
        </div>
      </div>
    </>
  );
}
