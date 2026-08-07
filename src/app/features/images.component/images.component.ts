import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotonService } from '../../core/services/images/photon-service';
import { ImageConversionOptions } from '../../core/interfaces/iimage-converter';
import { ImageOutputFormat } from '../../core/constants/supported-formats';
import { DropZone } from '../../shared/components/drop-zone/drop-zone';
import { FormatSelector, FormatOption } from '../../shared/components/format-selector/format-selector';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { FileSizePipe } from '../../shared/pipes/file-size-pipe';
import { CropData, ImageCropper } from '../../shared/components/image-cropper/image-cropper';
import { AnalyticsService } from '../../core/services/analytics-service';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

interface ResizePreset {
  name: string;
  format: ImageOutputFormat;
  width: number;
  height: number;
}

@Component({
  selector: 'app-images',
  standalone: true,
  imports: [CommonModule, FormsModule, DropZone, FormatSelector, FileSizePipe, ImageCropper, ProgressBar],
  templateUrl: './images.component.html',
  styleUrl: './images.component.css',
})
export class ImagesComponent implements OnDestroy {
  private imageService = inject(PhotonService);
  private analytics = inject(AnalyticsService);

  selectedFile: File | null = null;
  isProcessing = false;
  error: string | null = null;

  previewUrl: string | null = null;
  originalSizeBytes = 0;

  downloadUrl: string | null = null;
  outputFilename = '';
  outputSizeBytes = 0;

  // Pipeline Options mapped to our strict interface
  options: ImageConversionOptions = {
    format: 'JPG',
    quality: 80,
    filter: 'none'
  };

  // Configure the UI Format Selector options
  availableFormats: FormatOption[] = [
    { id: 'PNG', label: 'PNG (Lossless)', group: 'Standard' },
    { id: 'JPG', label: 'JPEG (Compressed)', group: 'Standard' },
    { id: 'WEBP', label: 'WebP (Modern Web)', group: 'Web-Friendly' },
    { id: 'AVIF', label: 'AVIF (Ultra Compressed)', group: 'Web-Friendly' },
    { id: 'ICO', label: 'ICO (Favicon)', group: 'Icons' }
  ];

  // Resize State
  resizeWidth: number | null = null;
  resizeHeight: number | null = null;
  originalAspectRatio = 1;
  lockRatio = true;

  showCropperModal = false;
  hasActiveCrop = false;
  crop: CropData = { x: 0, y: 0, width: 0, height: 0 };

  originalWidth = 0;
  originalHeight = 0;

  // Preset Resize Options for common social media and web use cases
  presets: ResizePreset[] = [
    { name: 'Instagram Square (1080x1080)', format: 'JPG', width: 1080, height: 1080 },
    { name: 'Facebook Cover (820x312)', format: 'JPG', width: 820, height: 312 },
    { name: 'YouTube Thumbnail (1280x720)', format: 'JPG', width: 1280, height: 720 },
    { name: 'Profile Picture (400x400)', format: 'JPG', width: 400, height: 400 },
  ];

  activePreset = '';

  // Progress Bar State
  progressValue = 0;
  progressStatus = '';
  private progressInterval: any;

  ngOnDestroy(): void {
    this.revokePreviewUrl();
    this.revokeDownloadUrl();
  }

  // Receives the File object directly from our DropZone component
  onFileSelected(file: File) {
    this.error = null;

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

  onFormatChange(newFormat: string) {
    this.options.format = newFormat as ImageOutputFormat;
  }

  private extractImageMetadata(file: File) {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      // Store originals persistently
      this.originalWidth = img.width;
      this.originalHeight = img.height;

      // Initialize current resize values to the originals
      this.resizeWidth = img.width;
      this.resizeHeight = img.height;

      this.originalAspectRatio = img.width / img.height;
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  toggleRatioLock() {
    this.lockRatio = !this.lockRatio;
    if (this.lockRatio && this.resizeWidth) {
      this.onWidthChanged();
    }
  }

  onWidthChanged() {
    this.activePreset = ''; // Clear preset selection on manual edit
    if (this.lockRatio && this.resizeWidth) {
      this.resizeHeight = Math.round(this.resizeWidth / this.originalAspectRatio);
    }
  }

  onHeightChanged() {
    this.activePreset = ''; // Clear preset selection on manual edit
    if (this.lockRatio && this.resizeHeight) {
      this.resizeWidth = Math.round(this.resizeHeight * this.originalAspectRatio);
    }
  }

  async convertImage() {
    if (!this.selectedFile) return;
    this.isProcessing = true;
    this.error = null;
    this.revokeDownloadUrl();

    // Reset Progress Bar
    this.progressValue = 0;
    this.progressStatus = `Encoding ${this.options.format}...`;

    // 1. Map Resize Options
    if (this.resizeWidth && this.resizeHeight) {
      this.options.resize = { width: this.resizeWidth, height: this.resizeHeight };
    } else {
      this.options.resize = undefined;
    }

    // 2. Map Crop Options
    if (this.crop && this.crop.width > 0 && this.crop.height > 0) {
      this.options.crop = {
        x: this.crop.x,
        y: this.crop.y,
        width: this.crop.width,
        height: this.crop.height
      };
    } else {
      this.options.crop = undefined;
    }

    // Start a smooth fake progress animation that halts at 90%
    this.progressInterval = setInterval(() => {
      if (this.progressValue < 90) {
        // Increment by a random amount between 5 and 15 for a natural feel
        this.progressValue += Math.floor(Math.random() * 10) + 5;
        if (this.progressValue > 90) this.progressValue = 90;
      }
    }, 300);

    try {
      const processedBlob = await this.imageService.convertAsync(this.selectedFile, this.options);

      // Fire the analytics ping!
      this.analytics.ping('image');

      // Snap progress to 100% when the promise resolves
      clearInterval(this.progressInterval);
      this.progressValue = 100;
      this.progressStatus = 'Finalizing file...';

      // Give the user a tiny 400ms visual delay to actually see the 100% state
      setTimeout(() => {
        this.downloadUrl = URL.createObjectURL(processedBlob);
        this.outputSizeBytes = processedBlob.size;

        const originalName = this.selectedFile!.name.split('.')[0];
        this.outputFilename = `${originalName}-converted.${this.options.format.toLowerCase()}`;

        this.isProcessing = false;
      }, 400);

    } catch (error: any) {
      this.error = error.message || 'Failed to convert this image.';
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

  get sizeChangePercent(): number {
    if (!this.originalSizeBytes || !this.outputSizeBytes) return 0;
    return Math.round((1 - this.outputSizeBytes / this.originalSizeBytes) * 100);
  }

  applyPreset(event: any) {
    const preset = this.presets.find(p => p.name === event.target.value);
    if (preset) {
      this.resizeWidth = preset.width;
      this.resizeHeight = preset.height;
      this.lockRatio = false; // Usually presets define fixed aspect ratios
      this.options.format = preset.format;
      this.options.quality = 90; // Reset quality to default for presets
    }
  }

  resetDimensions() {
    this.resizeWidth = this.originalWidth;
    this.resizeHeight = this.originalHeight;
  }

  // Cropper Modal Handlers
  openCropper() {
    this.showCropperModal = true;
  }

  closeCropper() {
    this.showCropperModal = false;
  }

  onCropApplied(cropData: CropData) {
    this.crop = cropData;
    this.hasActiveCrop = true;
    this.showCropperModal = false;
  }

  clearCrop() {
    this.crop = { x: 0, y: 0, width: 0, height: 0 };
    this.hasActiveCrop = false;
  }

}