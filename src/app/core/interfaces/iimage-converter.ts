import { ImageOutputFormat } from '../constants/supported-formats';

export interface ImageConversionOptions {
    format: ImageOutputFormat;
    quality?: number;
    resize?: {
        width?: number;
        height?: number;
        maintainAspectRatio?: boolean
    };
    crop?: { x: number; y: number; width: number; height: number };
    watermarkText?: string;
    filter?: 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'blur' | 'sharpen';
}

export interface IImageConverter {
    /**
     * Converts, resizes, and compresses an image.
     * @param file The original image file from the user.
     * @param options Options for the conversion.
     * @returns A Promise containing the processed image as a Blob.
     */
    convertAsync(file: File, options: ImageConversionOptions): Promise<Blob>;
}