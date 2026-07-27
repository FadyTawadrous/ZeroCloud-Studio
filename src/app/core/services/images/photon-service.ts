import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IImageConverter, ImageConversionOptions } from '../../interfaces/iimage-converter';

@Injectable({
  providedIn: 'root',
})
export class PhotonService implements IImageConverter {
  private platformId = inject(PLATFORM_ID);

  async convertAsync(file: File, options: ImageConversionOptions): Promise<Blob> {
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      return this.convertSvgOnMainThread(file, options);
    }

    return new Promise((resolve, reject) => {
      // Safety check: Ensure we are in a browser that supports Web Workers
      if (!isPlatformBrowser(this.platformId) || typeof Worker === 'undefined') {
        return reject(new Error('Web Workers are not supported in this environment.'));
      }

      // 1. Spawn the background worker specifically for this job
      const worker = new Worker(new URL('../../../features/images.component/photon.worker', import.meta.url), { type: 'module' });

      // 2. Listen for the finished image to come back from the worker
      worker.onmessage = (event) => {
        const { success, blob, error } = event.data;

        // Always kill the worker when it's done to free up RAM!
        worker.terminate();

        if (success && blob) {
          resolve(blob);
        } else {
          reject(new Error(error || 'Image conversion failed without a specific error.'));
        }
      };

      // Handle severe worker crashes (e.g., Out of Memory)
      worker.onerror = (error) => {
        worker.terminate();
        reject(new Error(`Worker execution failed: ${error.message}`));
      };

      // 3. Send the raw file and instructions to the worker
      worker.postMessage({ file, options });
    });
  }

  /**
   * Translates the SVG onto a Canvas and exports it as the requested format
   */
  private async convertSvgOnMainThread(file: File, options: ImageConversionOptions): Promise<Blob> {
    const canvas = await this.fileToCanvas(file, options);
    
    // Fallbacks just in case the format string gets messed up
    const targetFormat = options.format?.toLowerCase() || 'png';
    const mimeType = targetFormat === 'jpg' ? 'image/jpeg' : `image/${targetFormat}`;
    const quality = options.quality || 0.9;

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Could not encode SVG to ${mimeType}`));
        }
      }, mimeType, quality);
    });
  }
  
  /**
   * Helper: Converts an SVG (or any image) file into a rendered HTML Canvas
   */
  private async fileToCanvas(file: File, options: ImageConversionOptions): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        // 1. Get original dimensions (or fallback if SVG is missing width/height attributes)
        let originalWidth = img.width || 1920;
        let originalHeight = img.height || 1080;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // 2. Apply resizing math if user provided options
        if (options?.resize?.width || options?.resize?.height) {
          if (options.resize.width && options.resize.height) {
            // Force exact dimensions
            targetWidth = options.resize.width;
            targetHeight = options.resize.height;
          } else if (options.resize.width && !options.resize.height) {
            // Scale height proportionally based on width
            const ratio = options.resize.width / originalWidth;
            targetWidth = options.resize.width;
            targetHeight = originalHeight * ratio;
          } else if (!options.resize.width && options.resize.height) {
            // Scale width proportionally based on height
            const ratio = options.resize.height / originalHeight;
            targetHeight = options.resize.height;
            targetWidth = originalWidth * ratio;
          }
        }

        // 3. Set the canvas to the new resized dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 4. Draw the SVG. The browser's vector engine will perfectly scale 
        // the SVG math to fit these new dimensions without pixelating!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        URL.revokeObjectURL(url);
        resolve(canvas);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = url;
    });
  }

}