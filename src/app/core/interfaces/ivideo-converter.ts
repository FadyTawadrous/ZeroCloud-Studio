export interface IVideoConverter {
    convertAsync(file: File, targetFormat: string): Promise<Blob>;
    compressAsync(file: File, quality: number): Promise<Blob>;
    trimAsync(file: File, startSec: number, endSec: number): Promise<Blob>;
    extractAudioAsync(file: File): Promise<Blob>;
}
