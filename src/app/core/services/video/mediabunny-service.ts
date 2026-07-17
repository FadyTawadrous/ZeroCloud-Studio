import { Injectable, signal } from '@angular/core';
import { IVideoConverter, VideoConversionOptions } from '../../interfaces/ivideo-converter';

@Injectable({
  providedIn: 'root'
})
export class MediabunnyService {

  // Signals for reactive UI binding
  public isProcessing = signal<boolean>(false);
  public progress = signal<number>(0);
  public status = signal<string>('Idle');
  public error = signal<string | null>(null);
  public finalFile = signal<File | null>(null);

  private worker: Worker | null = null;

  processVideo(file: File, formatFrom: string, formatTo: string) {
    this.resetState();
    this.isProcessing.set(true);

    if (typeof Worker !== 'undefined') {
      // Initialize the worker pointing to our worker file
      this.worker = new Worker(new URL('../../../features/video.component/mediabunny.worker', import.meta.url), {
        type: 'module'
      });

      // Listen for messages coming back from the background thread
      this.worker.onmessage = ({ data }) => {
        switch (data.type) {
          case 'STATUS':
            this.status.set(data.status);
            break;
          case 'PROGRESS':
            this.progress.set(data.progress);
            break;
          case 'COMPLETE':
            this.finalFile.set(data.result);
            this.cleanup();
            break;
          case 'ERROR':
            this.error.set(data.error);
            this.cleanup();
            break;
        }
      };

      // Send the file to the background thread to start processing
      this.worker.postMessage({ action: 'PROCESS', file, formatFrom, formatTo });

    } else {
      // Fallback if the user's browser is severely outdated
      this.error.set('Web Workers are not supported in this browser.');
      this.isProcessing.set(false);
    }
  }

  cancel() {
    if (this.worker) {
      this.worker.terminate(); // Instantly kills the background thread
      this.error.set('Processing was canceled by the user.');
      this.cleanup();
    }
  }

  resetState() {
    this.isProcessing.set(false);
    this.progress.set(0);
    this.status.set('Idle');
    this.error.set(null);
    this.finalFile.set(null);
  }

  private cleanup() {
    this.isProcessing.set(false);
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}