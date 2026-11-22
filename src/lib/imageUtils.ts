/**
 * Resizes and compresses an image file or canvas frame for fast Gemini analysis
 * and creates a compact thumbnail for Firestore scanned_documents metadata.
 */

export async function fileToCapturedImage(file: File): Promise<{
  dataUrl: string;
  mimeType: string;
  base64Data: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported or corrupted image file.'));
      img.onload = () => {
        const maxDim = 1800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, outputMime === 'image/jpeg' ? 0.88 : undefined);
        const base64Data = dataUrl.split(',')[1] ?? '';
        resolve({ dataUrl, mimeType: outputMime, base64Data });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function captureVideoFrame(video: HTMLVideoElement): {
  dataUrl: string;
  mimeType: string;
  base64Data: string;
} {
  const maxDim = 1800;
  let width = video.videoWidth || 1280;
  let height = video.videoHeight || 720;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not capture frame from camera.');
  }
  ctx.drawImage(video, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const base64Data = dataUrl.split(',')[1] ?? '';
  return { dataUrl, mimeType: 'image/jpeg', base64Data };
}

export async function createCompactThumbnail(dataUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(undefined);
    img.onload = () => {
      const maxDim = 320;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(undefined);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const thumb = canvas.toDataURL('image/jpeg', 0.65);
      resolve(thumb.length <= 145000 ? thumb : undefined);
    };
    img.src = dataUrl;
  });
}
