import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ConversionService } from '../../core/services/conversion.service';
import { isConversionSupported, acceptFor } from '../../core/constants/supported-formats';

// ffmpeg.wasm loads the whole file into memory with no streaming support,
// so very large files will hang or crash the tab rather than fail cleanly.
// Adjust based on real-world testing on lower-end / mobile devices.
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [],
  templateUrl: './converter.component.html',
  styleUrl: './converter.component.css',
})
export class ConverterComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  public conversionService = inject(ConversionService);

  formatFrom = 'FILE';
  formatTo = 'FORMAT';
  isSupported = true;
  acceptAttr = '*/*';
  localError: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.formatFrom = params.get('from')?.toUpperCase() || 'JPEG';
      this.formatTo = params.get('to')?.toUpperCase() || 'PNG';

      this.isSupported = isConversionSupported(this.formatFrom, this.formatTo);
      this.acceptAttr = acceptFor(this.formatFrom);

      // Clear any leftover state from a previous route/conversion so a
      // stale error or progress value doesn't linger on the new page.
      this.localError = null;
      this.conversionService.resetState();

      this.updateSeoTags();
    });
  }

  ngOnDestroy(): void {
    // Don't leave a ~30MB engine and an active job running in the
    // background after the user navigates away from the converter.
    if (this.conversionService.isProcessing()) {
      this.conversionService.cancel();
    }
  }

  private updateSeoTags(): void {
    const pageTitle = this.isSupported
      ? `Convert ${this.formatFrom} to ${this.formatTo} Fast & Free | Local Processing`
      : `Conversion Not Supported | Local Converter`;

    const pageDescription = this.isSupported
      ? `Instantly convert ${this.formatFrom} files to ${this.formatTo} directly in your browser. 100% private, no uploads required, and completely free.`
      : `This conversion type isn't supported yet. Browse our list of supported local file conversions.`;

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: pageDescription });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    // Reset the input immediately so re-selecting the same file later
    // (e.g. retrying after an error) still fires a change event.
    input.value = '';

    if (!file) {
      return;
    }

    this.localError = null;

    if (!this.isSupported) {
      this.localError = `Converting ${this.formatFrom} to ${this.formatTo} isn't supported yet.`;
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMb = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
      this.localError = `That file is too large. Please choose a file under ${maxMb}MB.`;
      return;
    }

    this.conversionService.processFile(file, this.formatFrom, this.formatTo);
  }

  onCancel(): void {
    this.conversionService.cancel();
  }
}