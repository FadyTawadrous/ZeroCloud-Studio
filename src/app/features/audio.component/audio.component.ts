import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../core/services/audio/audio-service';
import { AudioConversionOptions } from '../../core/interfaces/iaudio-converter';
import { AudioOutputFormat } from '../../core/constants/supported-formats';
import { DropZone } from '../../shared/components/drop-zone/drop-zone';
import { FormatSelector, FormatOption } from '../../shared/components/format-selector/format-selector';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { FileSizePipe } from '../../shared/pipes/file-size-pipe';

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB limit for audio

@Component({
  selector: 'app-audio.component',
  imports: [
    CommonModule,
    FormsModule,
    DropZone,
    FormatSelector,
    ProgressBar,
    FileSizePipe
  ],
  templateUrl: './audio.component.html',
  styleUrl: './audio.component.css',
})
export class AudioComponent implements OnDestroy {
  private audioService = inject(AudioService);

  selectedFile: File | null = null;
  isProcessing = false;
  error: string | null = null;

  originalSizeBytes = 0;
  outputFilename = '';
  outputSizeBytes = 0;
  downloadUrl: string | null = null;
  inputPreviewUrl: string | null = null;

  // Pipeline Options
  options: AudioConversionOptions = {
    format: 'MP3',
    channels: 2
  };

  // UI State
  bitrateSelection: string = '192000'; // 192 kbps default
  enableTrim = false;
  trimStart = 0;
  trimEnd: number | null = null;

  availableFormats: FormatOption[] = [
    { id: 'MP3', label: 'MP3 (Standard)', group: 'Compressed' },
    { id: 'AAC', label: 'AAC (Apple/Web)', group: 'Compressed' },
    { id: 'OGG', label: 'OGG (Web Audio)', group: 'Compressed' },
    { id: 'OPUS', label: 'OPUS (Low Latency/Web)', group: 'Compressed' },
    { id: 'WAV', label: 'WAV (Lossless)', group: 'High Fidelity' },
    { id: 'FLAC', label: 'FLAC (Lossless)', group: 'High Fidelity' }
  ];

  // Progress Bar State
  progressValue = 0;
  progressStatus = '';
  private progressInterval: any;

  ngOnDestroy(): void {
    this.revokeDownloadUrl();
    this.revokeInputPreviewUrl();
  }

  onFileSelected(file: File) {
    this.error = null;

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.error = 'File is too large. Maximum size is 200MB.';
      return;
    }

    this.revokeDownloadUrl();
    this.revokeInputPreviewUrl();
    this.selectedFile = file;
    this.originalSizeBytes = file.size;

    // Create the playable URL for the input file
    this.inputPreviewUrl = URL.createObjectURL(file);

    // Reset trim state for new file
    this.enableTrim = false;
    this.trimStart = 0;
    this.trimEnd = null;
  }

  removeFile() {
    this.selectedFile = null;
    this.revokeDownloadUrl();
    this.revokeInputPreviewUrl();
  }

  onFormatChange(newFormat: string) {
    this.options.format = newFormat as AudioOutputFormat;

    // WAV and FLAC are lossless; bitrates don't apply the same way
    if (['WAV', 'FLAC'].includes(this.options.format)) {
      this.options.bitrate = undefined;
    } else {
      this.options.bitrate = parseInt(this.bitrateSelection, 10);
    }
  }

  onBitrateChange() {
    this.options.bitrate = parseInt(this.bitrateSelection, 10);
  }

  async convertAudio() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.error = null;
    this.revokeDownloadUrl();

    // Reset Progress Bar
    this.progressValue = 0;
    this.progressStatus = `Encoding ${this.options.format}...`;

    // Map Trimming
    if (this.enableTrim) {
      this.options.trim = {
        startSeconds: this.trimStart,
        endSeconds: this.trimEnd && this.trimEnd > this.trimStart ? this.trimEnd : undefined
      };
    } else {
      this.options.trim = undefined;
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
      const processedBlob = await this.audioService.convertAsync(this.selectedFile, this.options);

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
      this.error = error.message || 'Failed to process this audio file.';
    } finally {
      this.isProcessing = false;
    }
  }

  private revokeDownloadUrl() {
    if (this.downloadUrl) {
      URL.revokeObjectURL(this.downloadUrl);
      this.downloadUrl = null;
    }
  }

  private revokeInputPreviewUrl() {
    if (this.inputPreviewUrl) {
      URL.revokeObjectURL(this.inputPreviewUrl);
      this.inputPreviewUrl = null;
    }
  }

  get sizeChangePercent(): number {
    if (!this.originalSizeBytes || !this.outputSizeBytes) return 0;
    return Math.round((1 - this.outputSizeBytes / this.originalSizeBytes) * 100);
  }
}