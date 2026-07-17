import { Injectable, signal, inject } from '@angular/core';

// We will build these specialized services next
// import { VideoService } from './video/video.service';
// import { ImageService } from './images/image.service';
// import { AudioService } from './audio/audio.service';
// import { PdfService } from './pdf/pdf.service';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {
  // Signals that the ConverterComponent will bind to
  public status = signal<string>('Idle');
  public progress = signal<number>(0);
  public isProcessing = signal<boolean>(false);
  public error = signal<string | null>(null);

  // Injected specialized services (commented out until we build them)
  // private videoService = inject(VideoService);
  // private imageService = inject(ImageService);
  // private audioService = inject(AudioService);
  // private pdfService = inject(PdfService);

  // Keep track of which service is currently running so we can cancel it
  private activeServiceType: 'video' | 'image' | 'audio' | 'pdf' | null = null;

  public processFile(file: File, formatFrom: string, formatTo: string) {
    if (this.isProcessing()) {
      this.error.set('A conversion is already in progress.');
      return;
    }

    this.resetState();
    this.isProcessing.set(true);

    const type = this.determineCategory(formatFrom);

    try {
      switch (type) {
        case 'video':
          this.activeServiceType = 'video';
          // NOTE: We will wire this up to the VideoService next
          this.simulateWork('VideoEngine', formatFrom, formatTo, file);
          break;
        case 'image':
          this.activeServiceType = 'image';
          // this.imageService.convert(file, options);
          this.simulateWork('Photon Engine', formatFrom, formatTo, file);
          break;
        case 'audio':
          this.activeServiceType = 'audio';
          // this.audioService.convert(file, options);
          this.simulateWork('AudioEngine', formatFrom, formatTo, file);
          break;
        case 'pdf':
          this.activeServiceType = 'pdf';
          // this.pdfService.process([file], options);
          this.simulateWork('PDF Engine', formatFrom, formatTo, file);
          break;
        default:
          this.error.set(`Processing for ${formatFrom} is not implemented yet.`);
          this.isProcessing.set(false);
      }
    } catch (err: any) {
      this.error.set(err.message || 'An error occurred routing the file.');
      this.isProcessing.set(false);
    }
  }

  public cancel() {
    if (!this.isProcessing()) return;

    // Route the cancellation to the active service
    switch (this.activeServiceType) {
      case 'video':
        // this.videoService.cancel();
        break;
      case 'image':
        // this.imageService.cancel();
        break;
      // ... same for others
    }

    this.isProcessing.set(false);
    this.status.set('Cancelled');
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
    if (['PNG', 'JPG', 'JPEG', 'WEBP', 'AVIF', 'ICO', 'BMP', 'TIFF'].includes(f)) return 'image';
    if (['MP3', 'WAV', 'OGG', 'FLAC', 'AAC', 'OPUS'].includes(f)) return 'audio';
    if (['PDF'].includes(f)) return 'pdf';
    return 'unknown';
  }

  /**
   * TEMPORARY: Simulates processing so the UI works while we build the actual engines.
   */
  private simulateWork(engineName: string, from: string, to: string, file: File) {
    this.status.set(`Initializing ${engineName}...`);
    let p = 0;

    const interval = setInterval(() => {
      p += 10;
      this.progress.set(p);
      this.status.set(`Transcoding ${from} to ${to}...`);

      if (p >= 100) {
        clearInterval(interval);
        if (this.isProcessing()) {
          this.status.set('Done!');
          this.isProcessing.set(false);
          this.activeServiceType = null;

          // Create a dummy Blob for the simulation
          const dummyBlob = new Blob(['simulated data'], { type: 'application/octet-stream' });
          this.handleDownload(dummyBlob, `converted.${to.toLowerCase()}`);
        }
      }
    }, 200);
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

}