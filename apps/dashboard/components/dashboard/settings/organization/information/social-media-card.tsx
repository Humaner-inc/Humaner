'use client';

import * as React from 'react';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateSocialMedia } from '@/actions/organization/update-social-media';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon
} from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { Separator } from '@/components/ui/separator';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  updateSocialMediaSchema,
  type UpdateSocialMediaSchema
} from '@/schemas/organization/update-social-media-schema';
import type { SocialMediaDto } from '@/types/dtos/social-media-dto';

export type SocialMediaCardProps = CardProps & {
  socialMedia: SocialMediaDto;
};

export function SocialMediaCard({
  socialMedia,
  ...other
}: SocialMediaCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updateSocialMediaSchema,
    mode: 'all',
    defaultValues: {
      linkedInProfile: socialMedia.linkedInProfile,
      instagramProfile: socialMedia.instagramProfile,
      youTubeChannel: socialMedia.youTubeChannel,
      xProfile: socialMedia.xProfile,
      tikTokProfile: socialMedia.tikTokProfile,
      facebookPage: socialMedia.facebookPage
    }
  });
  const [showMore, setShowMore] = React.useState<boolean>(false);
  const handleToggleShowMore = (): void => {
    setShowMore((prev) => !prev);
  };
  const canSubmit = !methods.formState.isSubmitting;
  const onSubmit: SubmitHandler<UpdateSocialMediaSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await updateSocialMedia(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Social media updated');
    } else {
      toast.error("Couldn't update social media");
    }
  };
  return (
    <FormProvider {...methods}>
      <Card {...other}>
        <CardContent className="p-6">
          <form
            className="space-y-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="linkedInProfile"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <InputWithAdornments
                      type="url"
                      placeholder="https://linkedin.com/in/yoursite"
                      maxLength={2048}
                      startAdornment={
                        <div className="flex h-9 items-center justify-center border-r pr-3">
                          <LinkedInIcon className="size-4 shrink-0" />
                        </div>
                      }
                      className="pl-12"
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
              name="instagramProfile"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <InputWithAdornments
                      type="url"
                      placeholder="https://instagram.com/yoursite"
                      maxLength={2048}
                      startAdornment={
                        <div className="flex h-9 items-center justify-center border-r pr-3">
                          <InstagramIcon className="size-4 shrink-0" />
                        </div>
                      }
                      className="pl-12"
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
              name="youTubeChannel"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>YouTube</FormLabel>
                  <FormControl>
                    <InputWithAdornments
                      type="url"
                      placeholder="https://youtube.com/channels/yourchannel"
                      maxLength={2048}
                      startAdornment={
                        <div className="flex h-9 items-center justify-center border-r pr-3">
                          <YouTubeIcon className="size-4 shrink-0" />
                        </div>
                      }
                      className="pl-12"
                      disabled={methods.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showMore && (
              <>
                <FormField
                  control={methods.control}
                  name="xProfile"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel>X (Twitter)</FormLabel>
                      <FormControl>
                        <InputWithAdornments
                          type="url"
                          placeholder="https://x.com/yoursite"
                          maxLength={2048}
                          startAdornment={
                            <div className="flex h-9 items-center justify-center border-r pr-3">
                              <XIcon className="size-4 shrink-0" />
                            </div>
                          }
                          className="pl-12"
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
                  name="tikTokProfile"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel>TikTok</FormLabel>
                      <FormControl>
                        <InputWithAdornments
                          type="url"
                          placeholder="https://tiktok.com/yoursite"
                          maxLength={2048}
                          startAdornment={
                            <div className="flex h-9 items-center justify-center border-r pr-3">
                              <TikTokIcon className="size-4 shrink-0" />
                            </div>
                          }
                          className="pl-12"
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
                  name="facebookPage"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <InputWithAdornments
                          type="url"
                          placeholder="https://facebook.com/yoursite"
                          maxLength={2048}
                          startAdornment={
                            <div className="flex h-9 items-center justify-center border-r pr-3">
                              <FacebookIcon className="size-4 shrink-0" />
                            </div>
                          }
                          className="pl-12"
                          disabled={methods.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              className="text-success hover:text-success -ml-3"
              onClick={handleToggleShowMore}
            >
              {showMore ? 'Show less...' : 'Show more...'}
            </Button>
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
