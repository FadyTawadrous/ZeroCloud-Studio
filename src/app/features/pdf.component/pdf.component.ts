import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfService } from '../../core/services/pdf/pdf-service';
import { PdfConversionOptions } from '../../core/interfaces/ipdf-converter';
import { DropZone } from '../../shared/components/drop-zone/drop-zone';
import { FileSizePipe } from '../../shared/pipes/file-size-pipe';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';

@Component({
  selector: 'app-pdf.component',
  imports: [CommonModule, FormsModule, DropZone, FileSizePipe, ProgressBar],
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.css',
})
export class PdfComponent implements OnDestroy {
  private pdfService = inject(PdfService);

  selectedFiles: File[] = [];
  isProcessing = false;
  error: string | null = null;

  outputFilename = '';
  outputSizeBytes = 0;
  downloadUrl: string | null = null;

  // Progress UI
  progressValue = 0;
  progressStatus = '';
  private progressInterval: any;

  // Selected Action & Options
  selectedAction: PdfConversionOptions['action'] = 'merge';

  // Dynamic Option Fields
  extractPageRange = '';
  rotatePageRange = '';
  pageOrderStr = '';
  rotationAngle: 90 | 180 | 270 = 90;
  imageFormat: 'JPEG' | 'PNG' = 'JPEG';
  imageQuality: 'high' | 'medium' | 'low' = 'high';

  ngOnDestroy(): void {
    this.revokeDownloadUrl();
  }

  // Handle both single and multiple file selections
  onFilesSelected(event: File | File[]) {
    this.error = null;
    this.revokeDownloadUrl();

    const incomingFiles = Array.isArray(event) ? event : [event];
    this.selectedFiles = [...this.selectedFiles, ...incomingFiles];
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    if (this.selectedFiles.length === 0) {
      this.revokeDownloadUrl();
    }
  }

  changeAction(action: PdfConversionOptions['action']) {
    this.selectedAction = action;
    this.error = null;
    this.extractPageRange = '';
    this.rotatePageRange = '';
    this.pageOrderStr = '';
  }

  async processDocument() {
    if (this.selectedFiles.length === 0) return;

    // Validation
    if (this.selectedAction === 'merge' && this.selectedFiles.length < 2) {
      this.error = 'You must select at least 2 files to merge.';
      return;
    }
    if (this.selectedAction === 'images-to-pdf' && !this.selectedFiles.every(f => f.type.startsWith('image/'))) {
      this.error = 'All files must be images for this action.';
      return;
    }

    this.isProcessing = true;
    this.error = null;
    this.revokeDownloadUrl();
    this.progressValue = 0;
    this.progressStatus = `Executing ${this.selectedAction} pipeline...`;

    // Map UI to Options
    const options: PdfConversionOptions = {
      action: this.selectedAction,

      pageRange: this.selectedAction === 'extract'
        ? (this.extractPageRange ? this.extractPageRange.trim() : undefined)
        : (this.rotatePageRange ? this.rotatePageRange.trim() : undefined),

      rotationAngle: this.rotationAngle,
      imageOutputFormat: this.imageFormat,
      quality: this.imageQuality,
      pageOrder: this.selectedAction === 'organize' && this.pageOrderStr
        ? this.pageOrderStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
        : undefined
    };

    // Fake progress for UI responsiveness
    this.progressInterval = setInterval(() => {
      if (this.progressValue < 90) {
        this.progressValue += Math.floor(Math.random() * 10) + 5;
        if (this.progressValue > 90) this.progressValue = 90;
      }
    }, 200);

    try {
      const resultBlob = await this.pdfService.processAsync(this.selectedFiles, options);

      clearInterval(this.progressInterval);
      this.progressValue = 100;
      this.progressStatus = 'Finalizing file...';

      setTimeout(() => {
        this.downloadUrl = URL.createObjectURL(resultBlob);
        this.outputSizeBytes = resultBlob.size;
        this.generateOutputFilename(resultBlob.type);
        this.isProcessing = false;
      }, 500);

    } catch (error: any) {
      clearInterval(this.progressInterval);
      this.isProcessing = false;
      this.error = error.message || 'Failed to process document(s).';
    }
  }

  private generateOutputFilename(mimeType: string) {
    const isZip = mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed';
    const extension = isZip ? 'zip' : 'pdf';
    const baseName = this.selectedFiles.length === 1
      ? this.selectedFiles[0].name.split('.')[0]
      : 'Processed_Documents';

    this.outputFilename = `${baseName}_${this.selectedAction}.${extension}`;
  }

  private revokeDownloadUrl() {
    if (this.downloadUrl) {
      URL.revokeObjectURL(this.downloadUrl);
      this.downloadUrl = null;
    }
  }
}