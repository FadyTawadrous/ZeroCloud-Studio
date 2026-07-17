import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  imports: [],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBar {
  // The current progress percentage (0 to 100)
  @Input() progress = 0;

  // The text explaining what is happening right now
  @Input() status = 'Processing...';

  // Toggle the cancel button visibility
  @Input() showCancel = true;

  // Emit an event when the cancel button is clicked
  @Output() cancel = new EventEmitter<void>();

  // Ensure progress stays safely within 0-100 for the CSS width binding
  get safeProgress(): number {
    return Math.max(0, Math.min(100, this.progress));
  }

  onCancel() {
    this.cancel.emit();
  }
}