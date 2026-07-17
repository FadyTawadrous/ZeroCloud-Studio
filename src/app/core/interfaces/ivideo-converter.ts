export interface VideoConversionOptions {
  format: 'mp4' | 'webm' | 'mov' | 'mp3' | 'wav'; // Note: Allowing audio-only extraction
  resolution?: '1080p' | '720p' | '480p' | 'original';
  removeAudio?: boolean;
}

export interface IVideoConverter {
    convertAsync(file: File, targetFormat: string): Promise<Blob>;
    compressAsync(file: File, quality: number): Promise<Blob>;
    trimAsync(file: File, startSec: number, endSec: number): Promise<Blob>;
    extractAudioAsync(file: File): Promise<Blob>;

    convertAsync(file: File, options: VideoConversionOptions): Promise<Blob>;
}

