import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {
  private worker: Worker | null = null;
  private isBrowser: boolean;

  public status = signal<string>('Idle');
  public progress = signal<number>(0);
  public isProcessing = signal<boolean>(false);
  public error = signal<string | null>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Worker is now initialized lazily on first processFile() call,
    // not eagerly here, to avoid loading the ffmpeg core on every route.
  }

  private initWorker(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    if (typeof Worker === 'undefined') {
      this.error.set('Web Workers are not supported in this browser.');
      return false;
    }

    if (this.worker) {
      return true; // already initialized
    }

    this.worker = new Worker(
      new URL('../../features/converter.component/converter.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = ({ data }) => {
      switch (data.type) {
        case 'status':
          this.status.set(data.value);
          break;
        case 'progress':
          this.progress.set(data.value);
          break;
        case 'error':
          this.error.set(data.value);
          this.isProcessing.set(false);
          break;
        case 'complete':
          this.handleDownload(data.fileData, data.fileName, data.mimeType);
          this.status.set('Done!');
          this.isProcessing.set(false);
          break;
        case 'log':
          // You can wire this to a UI signal later if you want a debug panel
          console.log('[FFmpeg Worker]:', data.value);
          break;
      }
    };

    this.worker.onerror = (err) => {
      this.error.set(`Worker error: ${err.message}`);
      this.isProcessing.set(false);
      // Worker is likely in a bad state after an uncaught error; drop it
      // so the next processFile() call creates a fresh one.
      this.worker?.terminate();
      this.worker = null;
    };

    return true;
  }

  public processFile(file: File, formatFrom: string, formatTo: string) {
    if (this.isProcessing()) {
      this.error.set('A conversion is already in progress.');
      return;
    }

    const ready = this.initWorker();
    if (!ready || !this.worker) {
      return; // error signal already set (unsupported / SSR / init failure)
    }

    this.isProcessing.set(true);
    this.error.set(null);
    this.progress.set(0);
    this.status.set('Starting worker...');

    this.worker.postMessage({ file, formatFrom, formatTo });
  }

  /**
   * Cancels the current job and tears down the worker, releasing the
   * WASM memory it was holding. A new worker is created lazily on the
   * next processFile() call.
   */
  public cancel() {
    this.worker?.terminate();
    this.worker = null;
    this.isProcessing.set(false);
    this.status.set('Cancelled');
  }

  private handleDownload(data: Uint8Array<ArrayBuffer>, fileName: string, mimeType: string) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  public resetState() {
    this.error.set(null);
    this.status.set('Idle');
    this.progress.set(0);
  }

}