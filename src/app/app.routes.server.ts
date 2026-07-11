import { RenderMode, ServerRoute } from '@angular/ssr';
import { SUPPORTED_CONVERSIONS } from './core/constants/supported-formats';

export const serverRoutes: ServerRoute[] = [
  // Prerender the new static UI pages
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'images', renderMode: RenderMode.Prerender },
  { path: 'audio', renderMode: RenderMode.Prerender },
  { path: 'video', renderMode: RenderMode.Prerender },
  { path: 'pdf', renderMode: RenderMode.Prerender },

  // Prerender the dynamic SEO conversion paths
  {
    path: ':from-to-:to',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const params = [];

      for (const [from, toList] of Object.entries(SUPPORTED_CONVERSIONS)) {
        for (const to of toList) {
          params.push({
            'from-to-:to': `${from.toLowerCase()}-to-${to.toLowerCase()}`
          });
        }
      }

      return params;
    }
  },

  // Handle anything else via standard SSR
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];