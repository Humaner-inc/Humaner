'use client';

import * as React from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop
} from 'react-image-crop';

import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
): PercentCrop {
  return centerCrop(
    aspect
      ? makeAspectCrop(
          {
            unit: '%',
            width: 90
          },
          aspect,
          mediaWidth,
          mediaHeight
        )
      : { x: 0, y: 0, width: 90, height: 90, unit: '%' },
    mediaWidth,
    mediaHeight
  );
}

export async function getCroppedPngImage(
  imageSrc: HTMLImageElement,
  scaleFactor: number,
  pixelCrop: PixelCrop,
  maxImageSize: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Context is null, this should never happen.');
  }

  const scaleX = imageSrc.naturalWidth / imageSrc.width;
  const scaleY = imageSrc.naturalHeight / imageSrc.height;

  ctx.imageSmoothingEnabled = false;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    imageSrc,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const croppedImageUrl = canvas.toDataURL('image/png');
  const response = await fetch(croppedImageUrl);
  const blob = await response.blob();

  if (blob.size > maxImageSize) {
    return await getCroppedPngImage(
      imageSrc,
      scaleFactor * 0.9,
      pixelCrop,
      maxImageSize
    );
  }

  return croppedImageUrl;
}

export type CropperElement = {
  getCroppedImage: () => Promise<string | null>;
};
export type CropperProps = {
  file: File;
  aspectRatio?: number;
  circularCrop: boolean;
  maxImageSize: number;
};

const Cropper = React.forwardRef<CropperElement, CropperProps>(
  ({ file, aspectRatio, circularCrop, maxImageSize }, ref) => {
    const imgRef = React.useRef<HTMLImageElement | null>(null);
    const [imgSrc, setImgSrc] = React.useState<string>('');
    const [crop, setCrop] = React.useState<PercentCrop>();
    const [completedCrop, setCompletedCrop] = React.useState<PixelCrop | null>(
      null
    );

    React.useEffect(() => {
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(file);
    }, [file]);

    const onImageLoad = React.useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspectRatio));
      },
      [aspectRatio]
    );

    React.useImperativeHandle(
      ref,
      () => ({
        getCroppedImage: async () => {
          if (completedCrop && imgRef.current) {
            try {
              const croppedImage = await getCroppedPngImage(
                imgRef.current,
                1,
                completedCrop,
                maxImageSize
              );
              return croppedImage;
            } catch (error) {
              console.error('Error cropping image:', error);
              return null;
            }
          }
          return null;
        }
      }),
      [completedCrop, maxImageSize]
    );

    return (
      <div
        className="flex max-h-full max-w-full items-center justify-center overflow-hidden rounded p-4"
        style={{
          backgroundImage: `linear-gradient(45deg, #b0b0b0 25%, transparent 25%),
                            linear-gradient(-45deg, #b0b0b0 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #b0b0b0 75%),
                            linear-gradient(-45deg, transparent 75%, #b0b0b0 75%)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspectRatio}
          circularCrop={circularCrop}
        >
          {imgSrc && (
            <img
              ref={imgRef}
              alt="crop"
              src={imgSrc}
              className="!max-h-[277px] max-w-full"
              onLoad={onImageLoad}
            />
          )}
        </ReactCrop>
      </div>
    );
  }
);
Cropper.displayName = 'Cropper';

export { Cropper };
