import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-converter.component',
  imports: [],
  templateUrl: './converter.component.html',
  styleUrl: './converter.component.css',
})
export class ConverterComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  formatFrom = '';
  formatTo = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.formatFrom = params.get('from')?.toUpperCase() || 'FILE';
      this.formatTo = params.get('to')?.toUpperCase() || 'FORMAT';

      this.updateSeoTags();
    });
  }

  private updateSeoTags(): void {
    const pageTitle = `Convert ${this.formatFrom} to ${this.formatTo} Fast & Free | Local Processing`;
    const pageDescription = `Instantly convert ${this.formatFrom} files to ${this.formatTo} directly in your browser. 100% private, no uploads required, and completely free.`;

    // Update the browser tab title
    this.titleService.setTitle(pageTitle);

    // Update the meta description for search engine snippets
    this.metaService.updateTag({ name: 'description', content: pageDescription });

    // Open Graph tags for social sharing (Twitter, LinkedIn, etc.)
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDescription });
  }
}

if (typeof Worker !== 'undefined') {
  // Create a new
  const worker = new Worker(new URL('./converter.worker', import.meta.url));
  worker.onmessage = ({ data }) => {
    console.log(`page got message: ${data}`);
  };
  worker.postMessage('hello');
} else {
  // Web Workers are not supported in this environment.
  // You should add a fallback so that your program still executes correctly.
}