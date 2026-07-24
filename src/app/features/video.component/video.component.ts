import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediabunnyService } from '../../core/services/video/mediabunny-service';
import { VideoConversionOptions } from '../../core/interfaces/ivideo-converter';
import { VideoOutputFormat } from '../../core/constants/supported-formats';
import { DropZone } from '../../shared/components/drop-zone/drop-zone';
import { FormatSelector, FormatOption } from '../../shared/components/format-selector/format-selector';
import { FileSizePipe } from '../../shared/pipes/file-size-pipe';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';

const MAX_FILE_SIZE_BYTES = 2000 * 1024 * 1024; // 2GB limit for video

@Component({
  selector: 'app-video.component',
  imports: [
    CommonModule,
    FormsModule,
    DropZone,
    FormatSelector,
    FileSizePipe,
    ProgressBar],
  templateUrl: './video.component.html',
  styleUrl: './video.component.css',
})
export class VideoComponent implements OnDestroy {
  private videoService = inject(MediabunnyService);

  selectedFile: File | null = null;
  isProcessing = false;
  error: string | null = null;

  originalSizeBytes = 0;
  outputFilename = '';
  outputSizeBytes = 0;
  downloadUrl: string | null = null;
  inputPreviewUrl: string | null = null;

  // Progress Bar State
  progressValue = 0;
  progressStatus = '';
  private progressInterval: any;

  // Pipeline Options
  options: VideoConversionOptions = {
    format: 'MP4',
    resolution: 'original',
    removeAudio: false
  };

  // UI State mapping
  fpsSelection: string = 'original';
  bitrateSelection: string = 'auto';
  enableTrim = false;
  trimStart = 0;
  trimEnd: number | null = null;

  availableFormats: FormatOption[] = [
    { id: 'MP4', label: 'MP4 (H.264 / Universal)', group: 'Standard' },
    { id: 'WEBM', label: 'WebM (VP8 / VP9 / Web)', group: 'Web Optimized' }
  ];

  ngOnDestroy(): void {
    this.revokeUrls();
  }

  onFileSelected(file: File) {
    this.error = null;

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.error = 'File is too large. Maximum size is 2GB.';
      return;
    }

    this.revokeUrls();
    this.selectedFile = file;
    this.originalSizeBytes = file.size;
    this.inputPreviewUrl = URL.createObjectURL(file);

    this.enableTrim = false;
    this.trimStart = 0;
    this.trimEnd = null;
  }

  removeFile() {
    this.selectedFile = null;
    this.revokeUrls();
  }

  onFormatChange(newFormat: string) {
    this.options.format = newFormat as VideoOutputFormat;
  }

  async convertVideo() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.error = null;
    this.revokeDownloadUrl(); // Only clear the output URL, keep input preview alive

    this.progressValue = 0;
    this.progressStatus = `Transcoding to ${this.options.format}...`;

    // Map UI selections to the strict Options Interface
    this.options.fps = this.fpsSelection === 'original' ? undefined : parseInt(this.fpsSelection, 10);
    this.options.videoBitrate = this.bitrateSelection === 'auto' ? undefined : parseInt(this.bitrateSelection, 10);

    if (this.enableTrim) {
      this.options.trim = {
        startSeconds: this.trimStart,
        endSeconds: this.trimEnd && this.trimEnd > this.trimStart ? this.trimEnd : undefined
      };
    } else {
      this.options.trim = undefined;
    }

    // Smooth fake progress animation targeting GPU expectation
    this.progressInterval = setInterval(() => {
      if (this.progressValue < 90) {
        this.progressValue += Math.floor(Math.random() * 5) + 2;
        if (this.progressValue > 90) this.progressValue = 90;
      }
    }, 400);

    try {
      const processedBlob = await this.videoService.convertAsync(this.selectedFile, this.options);

      clearInterval(this.progressInterval);
      this.progressValue = 100;
      this.progressStatus = 'Muxing final file...';

      setTimeout(() => {
        this.downloadUrl = URL.createObjectURL(processedBlob);
        this.outputSizeBytes = processedBlob.size;

        const originalName = this.selectedFile!.name.split('.')[0];
        this.outputFilename = `${originalName}-converted.${this.options.format.toLowerCase()}`;

        this.isProcessing = false;
      }, 500);

    } catch (error: any) {
      clearInterval(this.progressInterval);
      this.isProcessing = false;
      this.error = error.message || 'Failed to process this video file.';
    }
  }

  private revokeUrls() {
    this.revokeDownloadUrl();
    if (this.inputPreviewUrl) {
      URL.revokeObjectURL(this.inputPreviewUrl);
      this.inputPreviewUrl = null;
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
}