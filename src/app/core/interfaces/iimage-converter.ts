export interface ImageConversionOptions {
    format: 'png' | 'jpeg' | 'webp';
    quality?: number;
    resize?: { width: number; height: number };
    crop?: { x: number; y: number; width: number; height: number };
    watermark?: string;
    filter?: 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage' | 'blur' | 'sharpen';
}

export interface IImageConverter {
    /**
   * Converts, resizes, and compresses an image.
   * @param file The original image file from the user.
   * @param options Options for the conversion, including target format, quality, resizing, cropping, watermarking, and filtering.
   * @returns A Promise containing the processed image as a Blob.
   */
    convertAsync(file: File, options: ImageConversionOptions): Promise<Blob>;
}