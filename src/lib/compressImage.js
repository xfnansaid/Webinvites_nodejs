/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * No external npm packages required.
 * 
 * @param {File} file - Original input file from <input type="file">
 * @param {Object} options
 * @param {number} [options.maxWidth=1200] - Max bounding box width
 * @param {number} [options.maxHeight=1200] - Max bounding box height
 * @param {number} [options.quality=0.82] - Quality compression ratio (0.0 to 1.0)
 * @param {string} [options.mimeType='image/webp'] - Target output format ('image/webp' or 'image/jpeg')
 * @returns {Promise<Blob>} - Compressed image blob ready for upload
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Invalid file provided for compression'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not supported'));
        }

        // Smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Fallback to jpeg if browser canvas doesn't support webp export
        const isWebpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        const outputMime = mimeType === 'image/webp' && !isWebpSupported ? 'image/jpeg' : mimeType;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image canvas compression failed'));
            }
          },
          outputMime,
          quality
        );
      };

      img.onerror = (err) => reject(new Error('Failed to load image for compression'));
    };

    reader.onerror = (err) => reject(new Error('Failed to read image file'));
  });
}
