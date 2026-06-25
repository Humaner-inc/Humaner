'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { TrashIcon, UploadIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updatePersonalDetails } from '@/actions/account/update-personal-details';
import { ChangeEmailModal } from '@/components/dashboard/settings/account/profile/change-email-modal';
import { CropPhotoModal } from '@/components/dashboard/settings/account/profile/crop-photo-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  FormMessage,
  FormProvider
} from '@/components/ui/form';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { Input } from '@/components/ui/input';
import { InputWithAdornments } from '@/components/ui/input-with-adornments';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { MAX_IMAGE_SIZE } from '@/constants/limits';
import { useZodForm } from '@/hooks/use-zod-form';
import { getInitials } from '@/lib/utils';
import {
  updatePersonalDetailsSchema,
  type UpdatePersonalDetailsSchema
} from '@/schemas/account/update-personal-details-schema';
import type { PersonalDetailsDto } from '@/types/dtos/personal-details-dto';
import { FileUploadAction } from '@/types/file-upload-action';

export type PersonalDetailsCardProps = CardProps & {
  details: PersonalDetailsDto;
};

export function PersonalDetailsCard({
  details,
  ...other
}: PersonalDetailsCardProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updatePersonalDetailsSchema,
    mode: 'onSubmit',
    defaultValues: {
      image: details.image ?? '',
      action: FileUploadAction.None,
      name: details.name ?? '',
      phone: details.phone ?? ''
    }
  });
  const name = methods.watch('name');
  const image = methods.watch('image');
  const canSubmit = !methods.formState.isSubmitting;
  const handleDrop = async (files: File[]): Promise<void> => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Uploaded image shouldn't exceed 5mb size limit");
      } else {
        const base64Image: string = await NiceModal.show(CropPhotoModal, {
          file,
          aspectRatio: 1,
          circularCrop: true
        });
        if (base64Image) {
          methods.setValue('action', FileUploadAction.Update);
          methods.setValue('image', base64Image);
        }
      }
    }
  };
  const handleRemoveImage = (): void => {
    methods.setValue('action', FileUploadAction.Delete);
    methods.setValue('image', undefined, {
      shouldValidate: true,
      shouldDirty: true
    });
  };
  const handleShowChangeEmailModal = (): void => {
    if (!details.email) {
      return;
    }
    NiceModal.show(ChangeEmailModal, {
      currentEmail: details.email
    });
  };
  const onSubmit: SubmitHandler<UpdatePersonalDetailsSchema> = async (
    values
  ) => {
    if (!canSubmit) {
      return;
    }
    const result = await updatePersonalDetails(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Personal details updated');
    } else {
      toast.error('Couldnt update personal details');
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
            <div className="flex items-center justify-center">
              <div className="relative">
                <ImageDropzone
                  accept={{ 'image/*': [] }}
                  multiple={false}
                  borderRadius="full"
                  onDrop={handleDrop}
                  src={image}
                  className="max-h-[120px] min-h-[120px] w-[120px] p-0.5"
                  disabled={methods.formState.isSubmitting}
                >
                  <Avatar className="size-28">
                    <AvatarFallback className="size-28 text-2xl">
                      {name ? (
                        getInitials(name)
                      ) : (
                        <UploadIcon className="size-5 shrink-0 text-muted-foreground" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </ImageDropzone>
                {image && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="absolute -bottom-1 -right-1 z-10 size-8 rounded-full bg-background !opacity-100"
                        disabled={methods.formState.isSubmitting}
                        onClick={handleRemoveImage}
                      >
                        <TrashIcon className="size-4 shrink-0" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Remove image</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="grid gap-x-8 gap-y-4">
              <FormField
                control={methods.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        maxLength={32}
                        autoComplete="name"
                        required
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
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        maxLength={32}
                        disabled={methods.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <InputWithAdornments
                  type="email"
                  maxLength={255}
                  autoComplete="username"
                  value={details.email ?? ''}
                  endAdornment={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-mr-2.5 min-w-fit bg-background"
                      onClick={handleShowChangeEmailModal}
                    >
                      Change
                    </Button>
                  }
                  disabled
                />
              </div>
            </div>
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
