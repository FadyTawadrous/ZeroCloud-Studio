import { Injectable } from '@angular/core';
import { IVideoConverter } from '../../interfaces/ivideo-converter';

@Injectable({
  providedIn: 'root',
})
export class FfmpegService  {
  // async convertAsync(file: File, targetFormat: string): Promise<Blob> {
  //   // 1. DYNAMIC IMPORT: The application downloads the FFmpeg JS wrapper chunk *right now*
  //   const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  //   const ffmpeg = new FFmpeg();

  //   // 2. LAZY WORKER: The browser spawns the isolated worker script *right now*
  //   // The build tool recognizes this syntax and creates a separate bundle for the worker
  //   const worker = new Worker(new URL('./ffmpeg.worker', import.meta.url), { type: 'module' });

  //   // ... proceed with the fallback conversion logic
  // }
}
