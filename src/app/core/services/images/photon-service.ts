import { Injectable } from '@angular/core';
import { IImageConverter, ImageConversionOptions } from '../../interfaces/iimage-converter';

@Injectable({
  providedIn: 'root',
})
export class PhotonService implements IImageConverter {
  async convertAsync(file: File, options: ImageConversionOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {

      // 1. Spawn the background worker specifically for this job
      const worker = new Worker(new URL('../../../features/images.component/photon.worker.ts', import.meta.url), { type: 'module' });

      // 2. Listen for the finished image to come back from the worker
      worker.onmessage = (event) => {
        const { success, blob, error } = event.data;

        // Always kill the worker when it's done to free up RAM!
        worker.terminate();

        if (success) {
          resolve(blob);
        } else {
          reject(error);
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        reject(error.message);
      };

      // 3. Send the raw file and instructions to the worker
      worker.postMessage({ file, options });
    });
  }
}
