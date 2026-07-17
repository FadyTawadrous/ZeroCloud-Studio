import { RenderMode, ServerRoute } from '@angular/ssr';
import { SUPPORTED_CONVERSIONS } from './core/constants/supported-formats';

export const serverRoutes: ServerRoute[] = [
  // Prerender the new static UI pages
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'images', renderMode: RenderMode.Prerender },
  { path: 'audio', renderMode: RenderMode.Prerender },
  { path: 'video', renderMode: RenderMode.Prerender },
  { path: 'pdf', renderMode: RenderMode.Prerender },

  {
    path: ':conversion', // Match the updated route
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const params = [];

      for (const [from, toList] of Object.entries(SUPPORTED_CONVERSIONS)) {
        for (const to of toList) {
          params.push({
            // Output the exact parameter name and the generated string
            conversion: `${from.toLowerCase()}-to-${to.toLowerCase()}`
          });
        }
      }

      return params;
    }
  },

  {
    path: '**',
    renderMode: RenderMode.Server
  }
];