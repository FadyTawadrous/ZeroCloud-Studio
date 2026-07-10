import { RenderMode, ServerRoute } from '@angular/ssr';
import { SUPPORTED_CONVERSIONS } from './core/constants/supported-formats';

export const serverRoutes: ServerRoute[] = [
  {
    path: ':from-to-:to',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const params = [];

      for (const [from, toList] of Object.entries(SUPPORTED_CONVERSIONS)) {
        for (const to of toList) {
          // Pass the combined string to Angular's literal parameter name
          params.push({
            'from-to-:to': `${from.toLowerCase()}-to-${to.toLowerCase()}`
          });
        }
      }

      return params;
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];