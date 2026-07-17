import { ImageOutputFormat } from '../constants/supported-formats';

export interface PdfConversionOptions {
    // The core operation the user wants to perform
    action: 'merge' | 'extract' | 'split' | 'pdf-to-images' | 'images-to-pdf' | 'compress' | 'rotate' | 'organize';

    // Used for 'extract' (e.g., "1,4,5-10") or 'rotate' (to target specific pages)
    pageRange?: string;

    // Used strictly when action is 'rotate'
    rotationAngle?: 90 | 180 | 270;

    // Used strictly when action is 'organize'.
    // Array of 1-based page numbers representing the new order.
    // Omitted pages are deleted. Duplicated numbers duplicate the page.
    // Example: [3, 1, 2, 2] -> Moves page 3 to front, keeps 1, duplicates 2, deletes all others.
    pageOrder?: number[];

    // Used strictly when action is 'pdf-to-images'
    imageOutputFormat?: ImageOutputFormat;

    // Used strictly when action is 'images-to-pdf'
    imageToPdfLayout?: {
        orientation: 'portrait' | 'landscape';
        margin: number; // e.g., 0 for borderless, 20 for standard margins
        fit: 'contain' | 'cover';
    };

    // Determines the DPI/resolution when rasterizing to images, 
    // or the compression level when action is 'compress'
    quality?: 'high' | 'medium' | 'low';
}

export interface IPdfConverter {
    /**
     * Processes one or more documents locally.
     * @param files An array of files (PDFs for most actions, Images for 'images-to-pdf').
     * @param options Options defining the specific operation.
     * @returns A Promise containing the final Blob (a single PDF, or a ZIP file if outputting multiple files).
     */
    processAsync(files: File[], options: PdfConversionOptions): Promise<Blob>;
}