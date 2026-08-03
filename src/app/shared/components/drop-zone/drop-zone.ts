import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-drop-zone',
  imports: [],
  templateUrl: './drop-zone.html',
  styleUrl: './drop-zone.css',
})
export class DropZone {
  // Customizable properties from the parent component
  @Input() acceptAttr = '*/*';
  @Input() title = 'Click or drag a file here';
  @Input() subtitle = 'Max file size: 500MB';
  @Input() disabled = false;
  @Input() multiple = false;

  // Emits the selected file back to the parent
  @Output() fileSelected = new EventEmitter<File>();
  @Output() filesSelected = new EventEmitter<File[]>(); // Emits multiple files if the 'multiple' input is true

  // Tracks if a file is currently hovering over the drop zone
  isDragOver = false;

  // Intercept drag over to show the visual highlight
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragOver = true;
    }
  }

  // Remove highlight when mouse leaves
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  // Handle the actual drop
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  // Handle standard click-to-browse selection
  onFileBrowse(event: Event) {
    const input = event.target as HTMLInputElement;

    // Ensure input.files exists before passing it to Array.from()
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }

    // Reset the input so the user can select the same file again if needed
    input.value = '';
  }

  private handleFiles(files: File[]) {
    if (files.length === 0) return;

    if (this.multiple) {
      // If multiple is enabled, emit the whole array
      this.filesSelected.emit(files);
    } else {
      // If multiple is false (Audio/Video), only emit the very first file
      this.fileSelected.emit(files[0]);
    }
  }

}