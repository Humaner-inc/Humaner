type DecodedBase64Image = {
  buffer: Buffer;
  mimeType: string;
};

export function decodeBase64Image(base64: string): DecodedBase64Image {
  if (!base64.startsWith('data:')) {
    throw new Error(`Couldn't decode base64 image`);
  }
  const mimeMatch = base64.match(/^data:(\w+\/\w+);/);
  const mimeType = mimeMatch?.[1];
  if (!mimeType) {
    throw new Error(`Could not distinguish mimetype`);
  }
  const buffer = Buffer.from(
    base64.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );

  return {
    buffer,
    mimeType
  };
}
