import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Cropper from 'cropperjs';

export interface CropData {
  x: number;
  y: number;
  width: number; // For our worker, this will store End X
  height: number; // For our worker, this will store End Y
}

@Component({
  selector: 'app-image-cropper',
  imports: [CommonModule],
  templateUrl: './image-cropper.html',
  styleUrl: './image-cropper.css',
})
export class ImageCropper implements AfterViewInit, OnDestroy {
  @Input() imageUrl: string | null = null;

  // Emits the final coordinates when the user clicks "Apply"
  @Output() cropApplied = new EventEmitter<CropData>();

  // Emits when the user clicks "Cancel"
  @Output() modalClosed = new EventEmitter<void>();

  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;

  private cropper: Cropper | null = null;

  ngAfterViewInit() {
    this.initializeCropper();
  }

  ngOnDestroy() {
    if (this.cropper) {
      this.cropper.destroy();
    }
  }

  private initializeCropper() {
    if (this.imageElement && this.imageElement.nativeElement) {
      this.cropper = new Cropper(this.imageElement.nativeElement, {
        viewMode: 2, // Restricts the crop box to not exceed the canvas size
        background: false, // Fits the modern aesthetic better
        zoomable: true,
        scalable: false,
        responsive: true,
      });
    }
  }

  applyCrop() {
    if (this.cropper) {
      // getData(true) returns rounded, exact pixel values relative to the natural image size!
      const data = this.cropper.getData(true);

      // IMPORTANT: We map this to match your WebWorker's (Start X, Start Y, End X, End Y) logic!
      const mappedCrop: CropData = {
        x: data.x,
        y: data.y,
        width: data.x + data.width,   // Translates to End X
        height: data.y + data.height  // Translates to End Y
      };

      this.cropApplied.emit(mappedCrop);
    }
  }

  cancelCrop() {
    this.modalClosed.emit();
  }
}