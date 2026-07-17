import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotonService } from '../../core/services/images/photon-service';
import { ImageConversionOptions } from '../../core/interfaces/iimage-converter';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB — Photon loads the whole image into memory

@Component({
  selector: 'app-images.component',
  imports: [CommonModule, FormsModule],
  templateUrl: './images.component.html',
  styleUrl: './images.component.css',
})
export class ImagesComponent implements OnDestroy {
  private imageService = inject(PhotonService);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  isProcessing = false;
  isDragging = false;
  error: string | null = null;

  previewUrl: string | null = null;
  originalSizeBytes = 0;

  downloadUrl: string | null = null;
  outputFilename = '';
  outputSizeBytes = 0;

  // Pipeline Options
  options: ImageConversionOptions = {
    format: 'webp',
    quality: 80,
    filter: 'none'
  };

  // Resize State
  resizeWidth: number | null = null;
  resizeHeight: number | null = null;
  originalAspectRatio = 1;
  lockRatio = true;

  ngOnDestroy(): void {
    this.revokePreviewUrl();
    this.revokeDownloadUrl();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file later
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  triggerFilePicker() {
    this.fileInputRef.nativeElement.click();
  }

  private handleFile(file: File) {
    this.error = null;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.error = 'Unsupported file type. Please choose a PNG, JPEG, or WebP image.';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMb = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
      this.error = `That image is too large. Please choose a file under ${maxMb}MB.`;
      return;
    }

    this.revokePreviewUrl();
    this.revokeDownloadUrl();

    this.selectedFile = file;
    this.originalSizeBytes = file.size;
    this.previewUrl = URL.createObjectURL(file);
    this.extractImageMetadata(file);
  }

  removeFile() {
    this.revokePreviewUrl();
    this.revokeDownloadUrl();
    this.selectedFile = null;
    this.originalSizeBytes = 0;
    this.resizeWidth = null;
    this.resizeHeight = null;
    this.error = null;
  }

  // Read the file to get its natural width/height for the aspect ratio math
  private extractImageMetadata(file: File) {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      this.resizeWidth = img.width;
      this.resizeHeight = img.height;
      this.originalAspectRatio = img.width / img.height;
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  toggleRatioLock() {
    this.lockRatio = !this.lockRatio;
    // If turning back on, snap the height to match the current width
    if (this.lockRatio && this.resizeWidth) {
      this.onWidthChanged();
    }
  }

  onWidthChanged() {
    if (this.lockRatio && this.resizeWidth) {
      this.resizeHeight = Math.round(this.resizeWidth / this.originalAspectRatio);
    }
  }

  onHeightChanged() {
    if (this.lockRatio && this.resizeHeight) {
      this.resizeWidth = Math.round(this.resizeHeight * this.originalAspectRatio);
    }
  }

  async convertImage() {
    if (!this.selectedFile) return;
    this.isProcessing = true;
    this.error = null;
    this.revokeDownloadUrl();

    // Map UI resize values back to the options object if they exist
    if (this.resizeWidth && this.resizeHeight) {
      this.options.resize = { width: this.resizeWidth, height: this.resizeHeight };
    } else {
      this.options.resize = undefined;
    }

    try {
      const processedBlob = await this.imageService.convertAsync(this.selectedFile, this.options);
      this.downloadUrl = URL.createObjectURL(processedBlob);
      this.outputSizeBytes = processedBlob.size;
      const originalName = this.selectedFile.name.split('.')[0];
      this.outputFilename = `${originalName}-converted.${this.options.format}`;
    } catch (error) {
      console.error('Conversion failed:', error);
      this.error = 'Failed to convert this image. Please try a different file or settings.';
    } finally {
      this.isProcessing = false;
    }
  }

  private revokePreviewUrl() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  private revokeDownloadUrl() {
    if (this.downloadUrl) {
      URL.revokeObjectURL(this.downloadUrl);
      this.downloadUrl = null;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }

  get sizeChangePercent(): number {
    if (!this.originalSizeBytes || !this.outputSizeBytes) return 0;
    return Math.round((1 - this.outputSizeBytes / this.originalSizeBytes) * 100);
  }
}
