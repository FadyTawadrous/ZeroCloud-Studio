import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {

  transform(bytes: number | null | undefined, decimals: number = 2): string {
    // Handle edge cases
    if (bytes === 0) return '0 Bytes';
    if (bytes == null || isNaN(bytes)) return '';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals; // Ensure decimals isn't negative
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    // Calculate the index for the sizes array based on the byte magnitude
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Return the formatted string (e.g., "1.45 MB")
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

}