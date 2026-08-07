import sharp from 'sharp';

const maxSize = 96 * 4;
const defaultFormat = 'jpeg' as const;
const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'avif'] as const;

type SupportedFormat = (typeof supportedFormats)[number];

function isSupportedFormat(format: string): format is SupportedFormat {
  return (supportedFormats as readonly string[]).includes(format);
}

export async function resizeImage(
  buffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions');
  }

  // Crop pixels can be 1px off a perfect square after browser rounding.
  let prepared = image;
  if (metadata.width !== metadata.height) {
    const side = Math.min(metadata.width, metadata.height);
    prepared = image.extract({
      left: Math.floor((metadata.width - side) / 2),
      top: Math.floor((metadata.height - side) / 2),
      width: side,
      height: side
    });
  }

  const currentSize = Math.min(metadata.width, metadata.height);
  let resizedImage = prepared;

  if (currentSize > maxSize) {
    resizedImage = prepared.resize(maxSize, maxSize);
  }

  const format = getFormatFromMimeType(mimeType);

  if (isSupportedFormat(format)) {
    return resizedImage.toFormat(format).toBuffer();
  }

  console.warn(
    `Unsupported mime type ${mimeType}, defaulting to ${defaultFormat}`
  );
  return resizedImage[defaultFormat]().toBuffer();
}

function getFormatFromMimeType(mimeType: string): string {
  try {
    const parts = mimeType.toLowerCase().split('/');
    if (parts.length !== 2 || parts[0] !== 'image') {
      throw new Error(`Invalid mime type: ${mimeType}`);
    }
    const subtype = parts[1] === 'jpg' ? 'jpeg' : parts[1];
    return subtype;
  } catch (error) {
    console.warn(
      `Error parsing mime type: ${error instanceof Error ? error.message : String(error)}. Using default format.`
    );
    return defaultFormat;
  }
}
