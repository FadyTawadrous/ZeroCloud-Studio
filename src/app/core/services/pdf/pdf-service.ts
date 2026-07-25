import { Injectable } from '@angular/core';
import { degrees, PDFDocument } from 'pdf-lib';
// import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { IPdfConverter, PdfConversionOptions } from '../../interfaces/ipdf-converter';

// pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

@Injectable({
  providedIn: 'root',
})
export class PdfService implements IPdfConverter {
  async processAsync(files: File[], options: PdfConversionOptions): Promise<Blob> {
    switch (options.action) {
      case 'images-to-pdf':
        return this.imagesToPdf(files, options);
      case 'pdf-to-images':
        return this.pdfToImages(files[0], options);
      case 'merge':
        return this.mergePdfs(files);
      case 'split':
        return this.splitPdf(files[0]);
      case 'extract':
        return this.extractPages(files[0], options);
      case 'rotate':
        return this.rotatePdf(files[0], options);
      case 'organize':
        return this.organizePdf(files[0], options);
      case 'compress':
        return this.compressPdf(files[0]);
      default:
        throw new Error(`The action '${options.action}' is not yet implemented.`);
    }
  }

  // ==========================================
  // 1. IMAGE <-> PDF OPERATIONS
  // ==========================================

  private async imagesToPdf(files: File[], options: PdfConversionOptions): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const imageBytes = await file.arrayBuffer();
      let pdfImage;

      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      } else if (file.type === 'image/png') {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else {
        console.warn(`Skipping unsupported image format: ${file.name}`);
        continue;
      }

      const { width, height } = pdfImage.scale(1);
      const page = pdfDoc.addPage([width, height]);

      page.drawImage(pdfImage, { x: 0, y: 0, width, height });
    }

    const pdfBytes = await pdfDoc.save();
    return this.createPdfBlob(pdfBytes);
  }

  private async pdfToImages(file: File, options: PdfConversionOptions): Promise<Blob> {
    // Dynamically import pdf.js only when this function is executed in the browser!
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const zip = new JSZip();
    const format = options.imageOutputFormat?.toLowerCase() || 'jpeg';
    const mimeType = `image/${format}`;
    const scaleMultiplier = options.quality === 'high' ? 3.0 : (options.quality === 'medium' ? 2.0 : 1.0);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: scaleMultiplier });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) throw new Error('Failed to create canvas context.');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const imageBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, 0.9);
      });

      if (imageBlob) {
        const paddedIndex = i.toString().padStart(pdf.numPages.toString().length, '0');
        zip.file(`page-${paddedIndex}.${format}`, imageBlob);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  // ==========================================
  // 2. STRUCTURAL PDF OPERATIONS (pdf-lib)
  // ==========================================

  /** ACTION: Merge multiple PDFs into a single file */
  private async mergePdfs(files: File[]): Promise<Blob> {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const sourceBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    return this.createPdfBlob(pdfBytes);
  }

  /** ACTION: Split a PDF into individual 1-page PDFs, packaged in a ZIP */
  private async splitPdf(file: File): Promise<Blob> {
    const sourceBytes = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(sourceBytes);
    const zip = new JSZip();

    for (let i = 0; i < sourcePdf.getPageCount(); i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
      newPdf.addPage(copiedPage);

      const pdfBytes = await newPdf.save();

      // Zero-pad numbering (e.g. page-01.pdf)
      const paddedIndex = (i + 1).toString().padStart(sourcePdf.getPageCount().toString().length, '0');
      zip.file(`page-${paddedIndex}.pdf`, pdfBytes);
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  /** ACTION: Extract specific pages into a new single PDF */
  private async extractPages(file: File, options: PdfConversionOptions): Promise<Blob> {
    if (!options.pageRange) throw new Error("Page range is required for extraction.");

    const sourceBytes = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(sourceBytes);
    const newPdf = await PDFDocument.create();

    const pagesToExtract = this.parsePageRange(options.pageRange, sourcePdf.getPageCount());
    const indices = pagesToExtract.map(p => p - 1); // convert from 1-based to 0-based

    const copiedPages = await newPdf.copyPages(sourcePdf, indices);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return this.createPdfBlob(pdfBytes);
  }

  /** ACTION: Rotate specific pages (or all pages) */
  private async rotatePdf(file: File, options: PdfConversionOptions): Promise<Blob> {
    const angle = options.rotationAngle || 90;
    const sourceBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(sourceBytes);

    let pagesToRotate: number[] = [];

    // 1. Strictly define which pages to rotate
    if (options.pageRange && options.pageRange.trim() !== '') {
      pagesToRotate = this.parsePageRange(options.pageRange, pdfDoc.getPageCount());

      // Fail-safe: If they typed nonsense, throw an error rather than rotating everything
      if (pagesToRotate.length === 0) {
        throw new Error("Invalid target pages provided.");
      }
    } else {
      // 2. Only rotate all if left intentionally blank
      pagesToRotate = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i + 1);
    }

    // 3. Apply rotation strictly to the targeted pages
    const pages = pdfDoc.getPages();
    for (const pageNum of pagesToRotate) {
      if (pageNum >= 1 && pageNum <= pages.length) {
        const page = pages[pageNum - 1];
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees(currentRot + angle));
      }
    }

    const pdfBytes = await pdfDoc.save();
    return this.createPdfBlob(pdfBytes);
  }

  /** ACTION: Organize (Reorder, Delete, Duplicate pages) */
  private async organizePdf(file: File, options: PdfConversionOptions): Promise<Blob> {
    if (!options.pageOrder || options.pageOrder.length === 0) {
      throw new Error("Page order array must be provided for organization.");
    }

    const sourceBytes = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(sourceBytes);
    const newPdf = await PDFDocument.create();

    const maxIndex = sourcePdf.getPageCount() - 1;

    // Validate indices and convert 1-based input to 0-based pdf-lib requirements
    const validIndices = options.pageOrder
      .map(p => p - 1)
      .filter(i => i >= 0 && i <= maxIndex);

    // Using copyPages with duplicates works natively in pdf-lib
    const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return this.createPdfBlob(pdfBytes);
  }

  /** ACTION: Clean & Compress (Strips orphaned objects from memory) */
  private async compressPdf(file: File): Promise<Blob> {
    const sourceBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(sourceBytes);

    // This strips unreferenced metadata and trims internal table structures
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    return this.createPdfBlob(pdfBytes);
  }

  private createPdfBlob(pdfBytes: Uint8Array): Blob {
    const arrayBuffer = pdfBytes.buffer as ArrayBuffer;
    const buffer = arrayBuffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength);
    return new Blob([buffer], { type: 'application/pdf' });
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  /**
   * Converts user strings like "1,3, 5-7" into [1, 3, 5, 6, 7]
   */
  private parsePageRange(rangeStr: string, maxPages: number): number[] {
    const pages = new Set<number>();
    const parts = rangeStr.replace(/\s+/g, '').split(',');

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        let start = parseInt(startStr, 10);
        let end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end)) {
          start = Math.max(1, start);
          end = Math.min(maxPages, end);
          for (let i = start; i <= end; i++) pages.add(i);
        }
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page);
        }
      }
    }

    // Return array sorted numerically
    return Array.from(pages).sort((a, b) => a - b);
  }
}