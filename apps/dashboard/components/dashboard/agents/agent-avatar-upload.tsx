'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import type { CharacterType } from '@prisma/client';
import { toast } from 'sonner';

import { updateAgentImage } from '@/actions/agents/update-agent-image';
import { CropPhotoModal } from '@/components/dashboard/settings/account/profile/crop-photo-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DeleteOverlayButton } from '@/components/ui/delete-action-button';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { MAX_IMAGE_SIZE } from '@/constants/limits';
import { CHARACTER_META } from '@/lib/character-presets';
import { toSameOriginImageUrl } from '@/lib/urls/to-same-origin-image-url';
import { cn } from '@/lib/utils';
import { FileUploadAction } from '@/types/file-upload-action';

export type AgentAvatarUploadProps = {
  agentId?: string;
  character: CharacterType;
  image?: string | null;
  size?: 'card' | 'compact' | 'dialog';
  disabled?: boolean;
  onImageChange?: (image: string | null) => void;
};

export function AgentAvatarUpload({
  agentId,
  character,
  image,
  size = 'dialog',
  disabled = false,
  onImageChange
}: AgentAvatarUploadProps): React.JSX.Element {
  const [currentImage, setCurrentImage] = React.useState(
    () => toSameOriginImageUrl(image) ?? null
  );
  const isCustomWithoutImage = character === 'CUSTOM' && !currentImage;
  const fallbackImage = isCustomWithoutImage
    ? null
    : CHARACTER_META[character].image;
  const displayImage = currentImage ?? fallbackImage;

  React.useEffect(() => {
    setCurrentImage(toSameOriginImageUrl(image) ?? null);
  }, [image]);

  const handleDrop = async (files: File[]): Promise<void> => {
    if (!files[0] || disabled) {
      return;
    }

    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Uploaded image shouldn't exceed 5mb size limit");
      return;
    }

    const base64Image: string = await NiceModal.show(CropPhotoModal, {
      file,
      aspectRatio: 1,
      circularCrop: true
    });

    if (!base64Image) {
      return;
    }

    if (!agentId) {
      setCurrentImage(base64Image);
      onImageChange?.(base64Image);
      return;
    }

    // Show the cropped image immediately while the API URL is persisted.
    setCurrentImage(base64Image);

    const result = await updateAgentImage({
      id: agentId,
      action: FileUploadAction.Update,
      image: base64Image
    });

    if (result?.serverError || result?.validationErrors) {
      setCurrentImage(toSameOriginImageUrl(image) ?? null);
      toast.error("Couldn't update profile picture");
      return;
    }

    const nextImage =
      toSameOriginImageUrl(result?.data?.imageUrl) ?? base64Image;
    setCurrentImage(nextImage);
    onImageChange?.(nextImage);
    toast.success('Profile picture updated');
  };

  const handleRemoveImage = async (): Promise<void> => {
    if (disabled) {
      return;
    }

    if (!agentId) {
      setCurrentImage(null);
      onImageChange?.(null);
      return;
    }

    const result = await updateAgentImage({
      id: agentId,
      action: FileUploadAction.Delete,
      image: undefined
    });

    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't remove profile picture");
      return;
    }

    setCurrentImage(null);
    onImageChange?.(null);
    toast.success('Profile picture removed');
  };

  const avatarSize =
    size === 'compact' ? 'size-16' : size === 'card' ? 'size-20' : 'size-24';
  const dropzoneSize =
    size === 'compact'
      ? 'size-16 p-0'
      : size === 'card'
        ? 'size-20 p-0'
        : 'size-24 min-h-24 max-h-24 w-24 p-0';
  const glowScale = size === 'compact' ? 'scale-[1.35]' : 'scale-[1.65]';

  return (
    <div className={cn('relative inline-flex', avatarSize)}>
      {displayImage ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-50 blur-2xl',
            glowScale
          )}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ) : null}

      <div className="relative size-full overflow-hidden rounded-full bg-white ring-2 ring-foreground/10 ring-offset-2 ring-offset-background">
        <ImageDropzone
          accept={{ 'image/*': [] }}
          multiple={false}
          disabled={disabled}
          onDrop={handleDrop}
          borderRadius="full"
          title="Upload image"
          className={cn(
            dropzoneSize,
            'border-0 bg-transparent shadow-none hover:bg-transparent'
          )}
        >
          <Avatar className={cn(avatarSize, 'rounded-full')}>
            {currentImage ? (
              <AvatarImage
                src={currentImage}
                alt="Agent profile"
                className="object-cover"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                avatarSize,
                'overflow-hidden rounded-full p-0',
                isCustomWithoutImage && 'bg-white'
              )}
            >
              {isCustomWithoutImage ? (
                <span className="px-2 text-center text-[10px] font-medium leading-tight text-muted-foreground">
                  Upload image
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fallbackImage!}
                  alt=""
                  className="size-full object-cover"
                />
              )}
            </AvatarFallback>
          </Avatar>
        </ImageDropzone>
      </div>

      {currentImage && !disabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DeleteOverlayButton
              className="absolute -bottom-1 -right-1 z-10"
              srLabel="Remove profile picture"
              onClick={handleRemoveImage}
            />
          </TooltipTrigger>
          <TooltipContent side="right">Remove profile picture</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
