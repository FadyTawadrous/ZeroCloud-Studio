import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ConversionService } from '../../core/services/conversion.service';
import { isConversionSupported, acceptFor } from '../../core/constants/supported-formats';
import { DropZone } from '../../shared/components/drop-zone/drop-zone';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB limit

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [DropZone, ProgressBar],
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
      const conversionParam = params.get('conversion');

      if (conversionParam && conversionParam.includes('-to-')) {
        const [from, to] = conversionParam.split('-to-');
        this.formatFrom = from.toUpperCase();
        this.formatTo = to.toUpperCase();
      } else {
        this.formatFrom = 'UNKNOWN';
        this.formatTo = 'UNKNOWN';
      }

      this.isSupported = isConversionSupported(this.formatFrom, this.formatTo);
      this.acceptAttr = acceptFor(this.formatFrom);
      this.localError = null;
      this.conversionService.resetState();
      this.updateSeoTags();
    });
  }

  ngOnDestroy(): void {
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

  // UPDATED: Now receives a File directly from our DropZone component
  onFileSelected(file: File) {
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