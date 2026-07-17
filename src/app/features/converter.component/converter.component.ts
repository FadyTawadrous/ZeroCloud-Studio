import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ConversionService } from '../../core/services/conversion.service';
import { isConversionSupported, acceptFor } from '../../core/constants/supported-formats';

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB limit for general browser stability

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
      // 1. Extract the single 'conversion' parameter (e.g., 'jpg-to-png')
      const conversionParam = params.get('conversion');

      if (conversionParam && conversionParam.includes('-to-')) {
        const [from, to] = conversionParam.split('-to-');
        this.formatFrom = from.toUpperCase();
        this.formatTo = to.toUpperCase();
      } else {
        // Fallback for malformed URLs
        this.formatFrom = 'UNKNOWN';
        this.formatTo = 'UNKNOWN';
      }

      this.isSupported = isConversionSupported(this.formatFrom, this.formatTo);
      this.acceptAttr = acceptFor(this.formatFrom);

      // Clear any leftover state from a previous route
      this.localError = null;
      this.conversionService.resetState();

      this.updateSeoTags();
    });
  }

  ngOnDestroy(): void {
    // Prevent orphaned background workers if the user navigates away
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