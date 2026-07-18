import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FormatOption {
  id: string;      // e.g., 'MP4'
  label: string;   // e.g., 'MP4 Video'
  icon?: string;   // Optional SVG or Emoji
  group?: string;  // e.g., 'Video', 'Animation'
}

@Component({
  selector: 'app-format-selector',
  imports: [CommonModule, FormsModule],
  templateUrl: './format-selector.html',
  styleUrl: './format-selector.css',
})
export class FormatSelector {
  // The list of formats the user can choose from
  @Input() options: FormatOption[] = [];

  // The currently selected format ID
  @Input() selectedFormat = '';

  // Label text above the selector
  @Input() label = 'Convert to:';

  // Disable the dropdown during processing
  @Input() disabled = false;

  // Emit the new selection when the user changes it
  @Output() selectionChange = new EventEmitter<string>();

  // Group the options by their 'group' property for the UI
  get groupedOptions(): { groupName: string, items: FormatOption[] }[] {
    if (!this.options || this.options.length === 0) return [];

    const map = new Map<string, FormatOption[]>();

    this.options.forEach(opt => {
      const groupKey = opt.group || 'Other';
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)?.push(opt);
    });

    return Array.from(map.entries()).map(([groupName, items]) => ({ groupName, items }));
  }

  onModelChange(newValue: string) {
    this.selectionChange.emit(newValue);
  }

}