import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotonService } from '../../core/services/images/photon-service';
import { ImageConversionOptions } from '../../core/interfaces/iimage-converter';

@Component({
  selector: 'app-images.component',
  imports: [CommonModule, FormsModule],
  templateUrl: './images.component.html',
  styleUrl: './images.component.css',
})
export class ImagesComponent {
  private imageService = inject(PhotonService);

  selectedFile: File | null = null;
  isProcessing = false;
  downloadUrl: string | null = null;
  outputFilename = '';

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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.downloadUrl = null;
      this.extractImageMetadata(this.selectedFile);
    }
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
    this.downloadUrl = null;

    // Map UI resize values back to the options object if they exist
    if (this.resizeWidth && this.resizeHeight) {
      this.options.resize = { width: this.resizeWidth, height: this.resizeHeight };
    } else {
      this.options.resize = undefined;
    }

    try {
      const processedBlob = await this.imageService.convertAsync(this.selectedFile, this.options);
      this.downloadUrl = URL.createObjectURL(processedBlob);
      const originalName = this.selectedFile.name.split('.')[0];
      this.outputFilename = `${originalName}-converted.${this.options.format}`;
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert image. Check console for details.");
    } finally {
      this.isProcessing = false;
    }
  }
}
