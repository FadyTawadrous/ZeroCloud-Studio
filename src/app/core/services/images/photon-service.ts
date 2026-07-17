import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IImageConverter, ImageConversionOptions } from '../../interfaces/iimage-converter';

@Injectable({
  providedIn: 'root',
})
export class PhotonService implements IImageConverter {
  private platformId = inject(PLATFORM_ID);

  async convertAsync(file: File, options: ImageConversionOptions): Promise<Blob> {
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
}