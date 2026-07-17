import { Injectable } from '@angular/core';
import { IVideoConverter, VideoConversionOptions } from '../../interfaces/ivideo-converter';

@Injectable({
  providedIn: 'root'
})
export class MediabunnyService implements IVideoConverter {

  async convertAsync(file: File, options: VideoConversionOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Spawn the dedicated video worker
      const worker = new Worker(new URL('./mediabunny.worker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (event) => {
        const { success, blob, error } = event.data;
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

      // Send the file and options
      worker.postMessage({ file, options });
    });
  }
}