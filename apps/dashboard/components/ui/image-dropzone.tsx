import * as React from 'react';
import { UploadIcon } from 'lucide-react';
import {
  useDropzone,
  type DropEvent,
  type DropzoneOptions,
  type FileRejection
} from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ImageDropzoneProps
  extends Omit<DropzoneOptions, 'onDrop' | 'onError'> {
  title?: string;
  subtitle?: string;
  src?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  onDrop?: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  accept,
  maxFiles = 1,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  title = 'Upload image',
  subtitle = 'Drag & drop or click to select',
  src,
  borderRadius = 'none',
  className,
  children,
  ...dropzoneProps
}) => {
  const dropzoneOptions: DropzoneOptions = React.useMemo(
    () => ({
      accept,
      maxFiles,
      maxSize,
      minSize,
      onDrop: (acceptedFiles, fileRejections, event) => {
        if (fileRejections.length > 0) {
          onError?.(
            new Error(`File rejected: ${fileRejections[0].errors[0].message}`)
          );
        } else {
          onDrop?.(acceptedFiles, fileRejections, event);
        }
      },
      disabled,
      ...dropzoneProps
    }),
    [
      accept,
      maxFiles,
      maxSize,
      minSize,
      onDrop,
      onError,
      disabled,
      dropzoneProps
    ]
  );

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneOptions);

  const borderRadiusClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full'
  }[borderRadius];

  const renderContent = () => {
    if (!src) {
      return (
        children || (
          <>
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UploadIcon className="size-5 shrink-0" />
            </div>
            <p className="mt-2 text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )
      );
    }

    return (
      <img
        src={src}
        alt={title}
        className={cn(
          'size-full max-h-full max-w-full object-cover',
          borderRadiusClass
        )}
      />
    );
  };

  return (
    <Button
      type="button"
      disabled={disabled}
      variant="outline"
      className={cn(
        'flex h-fit w-full flex-col items-center justify-center border-dashed hover:border-primary hover:bg-accent',
        borderRadiusClass,
        src ? 'p-0.5' : 'px-0 py-3',
        isDragActive && 'border-primary',
        className
      )}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {renderContent()}
    </Button>
  );
};
