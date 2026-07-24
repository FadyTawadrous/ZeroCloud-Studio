import { Injectable, signal } from '@angular/core';
import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  WebMOutputFormat
} from 'mediabunny';

import { IVideoConverter, VideoConversionOptions } from '../../interfaces/ivideo-converter';
import { acceptFor, VideoOutputFormat } from '../../constants/supported-formats';

@Injectable({
  providedIn: 'root'
})
export class MediabunnyService implements IVideoConverter {

  async convertAsync(file: File, options: VideoConversionOptions): Promise<Blob> {
    // 1. Prepare the Input stream
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    // 2. Select the correct output format wrapper
    const outputFormat = this.getOutputFormat(options.format);

    // 3. Prepare the Output to write directly to memory
    const target = new BufferTarget();
    const output = new Output({
      format: outputFormat,
      target: target,
    });

    // 4. Configure the conversion pipeline
    const conversionConfig: any = {
      input,
      output,
      video: {}
    };

    // Apply Audio Track Configuration
    if (options.removeAudio) {
      conversionConfig.audio = { discard: true };
    } else {
      conversionConfig.audio = { bitrate: 192000 }; // Default audio bitrate if not removing audio, 192 kbps (High Quality)
    }

    // Apply Target Resolution (Height)
    // By passing just the height, Mediabunny/WebCodecs automatically calculates 
    // the correct width to maintain the original aspect ratio!
    if (options.resolution && options.resolution !== 'original') {
      // parseInt('1080p') safely returns the integer 1080
      conversionConfig.video.height = parseInt(options.resolution, 10);
    }

    // Apply Video Bitrate
    if (options.videoBitrate) {
      conversionConfig.video.bitrate = options.videoBitrate;
    }

    // Apply Frame Rate (FPS)
    if (options.fps) {
      conversionConfig.video.frameRate = options.fps;
    }

    // Apply Trimming Time Range
    if (options.trim) {
      conversionConfig.trim = {
        start: options.trim.startSeconds,
        end: options.trim.endSeconds
      };
    }

    // 5. Initialize and execute the hardware-accelerated video conversion
    const conversion = await Conversion.init(conversionConfig);
    await conversion.execute();

    // 6. Extract the final buffer
    if (!target.buffer) {
      throw new Error('Video conversion failed: No output data was generated.');
    }

    const mimeType = acceptFor(options.format);
    return new Blob([target.buffer], { type: mimeType });
  }

  /**
   * Helper function to map strict format strings to Mediabunny's specific output classes.
   */
  private getOutputFormat(format: VideoOutputFormat) {
    switch (format) {
      case 'MP4': return new Mp4OutputFormat();
      case 'WEBM': return new WebMOutputFormat();
      default:
        throw new Error(`Unsupported output format for video pipeline: ${format}`);
    }
  }
}