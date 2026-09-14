const PALETTE = [
  '#0b00d1',
  '#f85919',
  '#2f9e8f',
  '#c45c9a',
  '#e6b325',
  '#7c5cbf',
  '#3d8b6e',
  '#d46a4c'
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function colorFromMemberSeed(seed: string): string {
  return PALETTE[hashSeed(seed) % PALETTE.length]!;
}

export function sampleImageAccent(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const red = pixels[i] ?? 0;
          const green = pixels[i + 1] ?? 0;
          const blue = pixels[i + 2] ?? 0;
          const alpha = pixels[i + 3] ?? 0;
          if (alpha < 80) continue;
          const luma = (red * 299 + green * 587 + blue * 114) / 1000;
          if (luma < 28 || luma > 230) continue;
          r += red;
          g += green;
          b += blue;
          count += 1;
        }
        if (count === 0) {
          resolve(null);
          return;
        }
        resolve(
          `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`
        );
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
