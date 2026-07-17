import { VideoOutputFormat } from '../constants/supported-formats';

export interface VideoConversionOptions {
  format: VideoOutputFormat;

  // Target resolution. If not provided, it defaults to original.
  resolution?: '2160p' | '1080p' | '720p' | '480p' | 'original';

  // Target video bitrate in bits per second (e.g., 2500000 for 2.5 Mbps).
  videoBitrate?: number;

  // Target frame rate (e.g., 24, 30, 60). If omitted, matches original.
  fps?: number;

  // Trims the video. Values are in seconds.
  trim?: {
    startSeconds: number;
    endSeconds?: number;
  };

  // If true, strips the audio track from the output file entirely.
  removeAudio?: boolean;
}

export interface IVideoConverter {
  /**
   * Converts, compresses, trims, and resizes a video file.
   * @param file The original video file from the user.
   * @param options Options defining the final output.
   * @returns A Promise containing the processed video as a Blob.
   */
  convertAsync(file: File, options: VideoConversionOptions): Promise<Blob>;
}