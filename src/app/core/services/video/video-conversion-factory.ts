import { Injectable, inject } from '@angular/core';
import { MediabunnyService } from './mediabunny-service';
import { FfmpegService } from './ffmpeg-service';
//import { canEncode } from 'mediabunny';
import { IVideoConverter } from '../../interfaces/ivideo-converter';

@Injectable({
  providedIn: 'root',
})
export class VideoConversionFactory {
  private mediabunny = inject(MediabunnyService);
  private ffmpeg = inject(FfmpegService);

  // async getEngine(targetCodec: string = 'avc'): Promise<IVideoConverter> {
  //   // 1. Check if the browser supports WebCodecs hardware encoding
  //   const hardwareSupported = await canEncode(targetCodec);

  //   // 2. Route the request seamlessly
  //   if (hardwareSupported) {
  //     console.log('Routing to Mediabunny (Hardware Accelerated)');
  //     return this.mediabunny;
  //   } else {
  //     console.log('Routing to FFmpeg (Software Fallback)');
  //     return this.ffmpeg;
  //   }
  // }
}
