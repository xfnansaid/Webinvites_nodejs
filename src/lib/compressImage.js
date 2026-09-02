/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Iteratively lowers quality and dimensions until the output is under the
 * target size, guaranteeing the result stays below the limit.
 *
 * @param {File} file - Original input file from <input type="file">
 * @param {Object} options
 * @param {number} [options.maxWidth=1200] - Max bounding box width
 * @param {number} [options.maxHeight=1200] - Max bounding box height
 * @param {number} [options.quality=0.82] - Starting quality (0.0–1.0)
 * @param {string} [options.mimeType='image/webp'] - Target output format
 * @param {number} [options.targetSizeKB=200] - Maximum output size in KB (0 = no limit)
 * @param {number} [options.minQuality=0.30] - Lowest quality to try before shrinking
 * @param {number} [options.minDimension=400] - Smallest width/height before giving up
 * @returns {Promise<Blob>} - Compressed image blob ready for upload
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/webp',
    targetSizeKB = 200,
    minQuality = 0.30,
    minDimension = 400,
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
        // Calculate aspect-ratio preserved dimensions
        let { width, height } = img;
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

        const isWebpSupported =
          document.createElement('canvas')
            .toDataURL('image/webp')
            .startsWith('data:image/webp');
        const outputMime =
          mimeType === 'image/webp' && !isWebpSupported ? 'image/jpeg' : mimeType;

        const targetBytes = targetSizeKB * 1024;

        const encode = (w, h, q) =>
          new Promise((res, rej) => {
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, w);
            canvas.height = Math.max(1, h);
            const ctx = canvas.getContext('2d');
            if (!ctx) return rej(new Error('Canvas 2D context not supported'));

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob(
              (blob) => (blob ? res(blob) : rej(new Error('Canvas compression failed'))),
              outputMime,
              q,
            );
          });

        (async () => {
          try {
            let curW = width;
            let curH = height;
            let curQ = quality;
            let best = await encode(curW, curH, curQ);

            // If no target or already under budget, return immediately
            if (targetBytes <= 0 || best.size <= targetBytes) {
              return resolve(best);
            }

            // Iteration 1: progressively lower quality at current dimensions
            const qualitySteps = [0.70, 0.55, 0.42, 0.35, minQuality];
            for (const q of qualitySteps) {
              if (q >= curQ) continue; // don't go higher
              const blob = await encode(curW, curH, q);
              if (blob.size < best.size) best = blob;
              if (blob.size <= targetBytes) return resolve(blob);
              curQ = q;
            }

            // Iteration 2: if still over budget, shrink dimensions and repeat
            const dimSteps = [1000, 800, 600, minDimension];
            for (const dim of dimSteps) {
              if (dim >= Math.min(curW, curH)) continue;
              const scale = dim / Math.min(curW, curH);
              const newW = Math.round(curW * scale);
              const newH = Math.round(curH * scale);
              curW = newW;
              curH = newH;

              // Try a few quality levels at this dimension
              for (const q of [0.72, 0.55, 0.42, minQuality]) {
                const blob = await encode(curW, curH, q);
                if (blob.size < best.size) best = blob;
                if (blob.size <= targetBytes) return resolve(blob);
              }
            }

            // Return the smallest we managed — it's the best we can do
            return resolve(best);
          } catch (err) {
            return reject(err);
          }
        })();
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
  });
}
