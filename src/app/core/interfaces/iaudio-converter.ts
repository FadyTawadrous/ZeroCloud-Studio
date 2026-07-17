import { AudioOutputFormat } from '../constants/supported-formats';

export interface AudioConversionOptions {
    format: AudioOutputFormat;

    // Target bitrate for compression (e.g., 128000 for 128 kbps, 320000 for 320 kbps).
    bitrate?: number;

    // Trims the audio. Values are in seconds.
    trim?: {
        startSeconds: number;
        endSeconds?: number;
    };

    // Common sample rates: 44100 (CD quality), 48000 (Video standard)
    sampleRate?: number;

    // 1 for Mono, 2 for Stereo
    channels?: 1 | 2;

    // Volume multiplier (e.g., 0.5 is half volume, 1.0 is normal, 2.0 is double)
    volumeMultiplier?: number;
}

export interface IAudioConverter {
    /**
     * Converts, trims, and compresses an audio file.
     * @param file The original audio or video file from the user.
     * @param options Options for target format, bitrate, trimming, and channels.
     * @returns A Promise containing the processed audio as a Blob.
     */
    convertAsync(file: File, options: AudioConversionOptions): Promise<Blob>;
}