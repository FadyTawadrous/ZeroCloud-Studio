import { Injectable } from '@angular/core';
import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Mp3OutputFormat,
  WavOutputFormat,
  OggOutputFormat,
  FlacOutputFormat,
  AdtsOutputFormat
} from 'mediabunny';

import { registerAacEncoder } from '@mediabunny/aac-encoder';
import { registerMp3Encoder } from '@mediabunny/mp3-encoder';
import { registerFlacEncoder } from '@mediabunny/flac-encoder';
registerAacEncoder();
registerMp3Encoder();
registerFlacEncoder();

import { IAudioConverter, AudioConversionOptions } from '../../interfaces/iaudio-converter';
import { acceptFor, AudioOutputFormat } from '../../constants/supported-formats';

@Injectable({
  providedIn: 'root',
})
export class AudioService implements IAudioConverter {
  async convertAsync(file: File, options: AudioConversionOptions): Promise<Blob> {
    // 1. Prepare the Input stream from the user's File
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    // 2. Select the correct output format wrapper
    const outputFormat = this.getOutputFormat(options.format);

    // 3. Prepare the Output to write directly to the browser's memory
    const target = new BufferTarget();
    const output = new Output({
      format: outputFormat,
      target: target,
    });

    // 4. Configure the conversion pipeline
    const conversionConfig: any = {
      input,
      output,
      audio: {}
    };

    // Apply Audio Specifics (Bitrate, Sample Rate, Channels)
    if (options.bitrate) conversionConfig.audio.bitrate = options.bitrate;
    if (options.sampleRate) conversionConfig.audio.sampleRate = options.sampleRate;
    if (options.channels) conversionConfig.audio.numberOfChannels = options.channels;

    // Apply Trimming Time Range
    if (options.trim) {
      conversionConfig.trim = {
        start: options.trim.startSeconds,
        end: options.trim.endSeconds // If undefined, Mediabunny will run to the end of the file
      };
    }

    // 5. Initialize and execute the hardware-accelerated conversion
    const conversion = await Conversion.init(conversionConfig);
    await conversion.execute();

    // 6. Extract the final buffer and return as a standard Blob
    if (!target.buffer) {
      throw new Error('Audio conversion failed: No output data was generated.');
    }

    const mimeType = acceptFor(options.format);
    return new Blob([target.buffer], { type: mimeType });
  }

  /**
   * Helper function to map our strict format strings to Mediabunny's specific output classes.
   */
  private getOutputFormat(format: AudioOutputFormat) {
    switch (format) {
      case 'MP3': return new Mp3OutputFormat();
      case 'WAV': return new WavOutputFormat();
      case 'OGG': return new OggOutputFormat();
      case 'FLAC': return new FlacOutputFormat();
      case 'AAC': return new AdtsOutputFormat(); // AAC is natively wrapped in ADTS headers
      case 'OPUS': return new OggOutputFormat(); // Opus audio is typically packaged inside an Ogg container
      default:
        throw new Error(`Unsupported output format for Mediabunny: ${format}`);
    }
  }
}
