import { Injectable, signal, inject } from '@angular/core';

import { MediabunnyService } from './video/mediabunny-service';
import { PhotonService } from './images/photon-service';
import { AudioService } from './audio/audio-service';
import { PdfService } from './pdf/pdf-service';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {
  // Signals that the ConverterComponent will bind to
  public status = signal<string>('Idle');
  public progress = signal<number>(0);
  public isProcessing = signal<boolean>(false);
  public error = signal<string | null>(null);

  // Injected specialized engines
  private videoService = inject(MediabunnyService);
  private imageService = inject(PhotonService);
  private audioService = inject(AudioService);
  private pdfService = inject(PdfService);

  // Keep track of which service is currently running so we can cancel it
  private activeServiceType: 'video' | 'image' | 'audio' | 'pdf' | null = null;

  // We make this async to handle the Promises returned by your engines
  public async processFile(file: File, formatFrom: string, formatTo: string) {
    if (this.isProcessing()) {
      this.error.set('A conversion is already in progress.');
      return;
    }

    this.resetState();
    this.isProcessing.set(true);

    const type = this.determineCategory(formatFrom);
    const target = formatTo.toUpperCase();

    try {
      let resultBlob: Blob;
      let finalExtension = target.toLowerCase();

      // Fake progress interval for engines that don't emit live progress yet
      this.startSimulatedProgress(type);

      switch (type) {
        case 'video':
          this.activeServiceType = 'video';
          this.status.set(`Transcoding Video to ${target}...`);
          resultBlob = await this.videoService.convertAsync(file, {
            format: target.toLowerCase() as any
          });
          break;

        case 'image':
          this.activeServiceType = 'image';
          this.status.set(`Converting Image to ${target}...`);

          if (target === 'PDF') {
            this.activeServiceType = 'pdf';
            resultBlob = await this.pdfService.processAsync([file], { action: 'images-to-pdf' });
          } else {
            resultBlob = await this.imageService.convertAsync(file, {
              format: target.toLowerCase() as any
            });
          }
          break;

        case 'audio':
          this.activeServiceType = 'audio';
          this.status.set(`Transcoding Audio to ${target}...`);
          resultBlob = await this.audioService.convertAsync(file, {
            format: target.toLowerCase() as any
          });
          break;

        case 'pdf':
          this.activeServiceType = 'pdf';
          this.status.set(`Processing PDF...`);

          if (['JPEG', 'PNG', 'JPG'].includes(target)) {
            resultBlob = await this.pdfService.processAsync([file], {
              action: 'pdf-to-images',
              imageOutputFormat: target as any,
              quality: 'high'
            });
            finalExtension = 'zip';
          } else {
            resultBlob = await this.pdfService.processAsync([file], { action: 'compress' });
          }
          break;

        default:
          throw new Error(`Processing for ${formatFrom} is not implemented yet.`);
      }

      // Finalize successful conversion
      this.completeProgress();
      this.pingTelemetry(this.activeServiceType as 'video' | 'image' | 'audio' | 'pdf'); // ping telemetry is fire-and-forget, so we don't await it
      this.handleDownload(resultBlob, `${file.name.split('.')[0]}_converted.${finalExtension}`);

    } catch (err: any) {
      clearInterval(this.progressInterval);
      this.error.set(err.message || 'An error occurred routing the file.');
      this.isProcessing.set(false);
      this.status.set('Failed');
      this.progress.set(0);
    }
  }

  public cancel() {
    if (!this.isProcessing()) return;

    clearInterval(this.progressInterval);

    // Route the cancellation to the active service
    switch (this.activeServiceType) {
      case 'video':
        // this.videoService.cancel();
        break;
      case 'image':
        // this.imageService.cancel();
        break;
      case 'audio':
        // this.audioService.cancel();
        break;
      case 'pdf':
        // PDF-lib runs entirely in memory and is usually instantaneous, but you can add abort controllers later
        break;
    }

    this.isProcessing.set(false);
    this.status.set('Cancelled');
    this.progress.set(0);
    this.activeServiceType = null;
  }

  public resetState() {
    this.error.set(null);
    this.status.set('Idle');
    this.progress.set(0);
  }

  // --- Helpers ---

  private determineCategory(format: string): 'video' | 'image' | 'audio' | 'pdf' | 'unknown' {
    const f = format.toUpperCase();
    if (['MP4', 'WEBM', 'MOV', 'MKV', 'AV1'].includes(f)) return 'video';
    if (['PNG', 'JPG', 'JPEG', 'WEBP', 'AVIF', 'ICO', 'BMP', 'TIFF', 'SVG'].includes(f)) return 'image';
    if (['MP3', 'WAV', 'OGG', 'FLAC', 'AAC', 'OPUS'].includes(f)) return 'audio';
    if (['PDF'].includes(f)) return 'pdf';
    return 'unknown';
  }

  // A generic progress simulator to keep the UI feeling alive while we await the backend promises
  private progressInterval: any;
  private startSimulatedProgress(engineName: string) {
    this.progress.set(0);
    this.progressInterval = setInterval(() => {
      let current = this.progress();
      if (current < 90) {
        this.progress.set(current + Math.floor(Math.random() * 10) + 2);
      }
    }, 300);
  }

  private completeProgress() {
    clearInterval(this.progressInterval);
    this.progress.set(100);
    this.status.set('Done!');
    this.isProcessing.set(false);
    this.activeServiceType = null;
  }

  /**
   * Triggers a browser download for the final converted Blob.
   */
  private handleDownload(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  private async pingTelemetry(pipelineType: 'video' | 'image' | 'audio' | 'pdf') {
    if (!navigator.onLine) return; // Fail silently if fully offline

    try {
      fetch('https://telemetry-worker.fadytawadrous3.workers.dev/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: pipelineType }),
        keepalive: true // Crucial: Ensures it sends even if they immediately close the tab
      });
    } catch (e) {
      // Analytics should never crash the app, so we swallow any network errors
    }
  }

}