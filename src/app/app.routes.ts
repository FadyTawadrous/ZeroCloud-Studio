import { Routes } from '@angular/router';
import { ConverterComponent } from './features/converter.component/converter.component';

export const routes: Routes = [
  // 1. Static Domain Routes (Loaded first)
  // We use dynamic imports so each pipeline is bundled separately
  { 
    path: '', 
    loadComponent: () => import('./features/home.component/home.component').then(c => c.HomeComponent) 
  },
  { 
    path: 'images', 
    loadComponent: () => import('./features/images.component/images.component').then(c => c.ImagesComponent) 
  },
  { 
    path: 'audio', 
    loadComponent: () => import('./features/audio.component/audio.component').then(c => c.AudioComponent) 
  },
  { 
    path: 'video', 
    loadComponent: () => import('./features/video.component/video.component').then(c => c.VideoComponent) 
  },
  { 
    path: 'pdf', 
    loadComponent: () => import('./features/pdf.component/pdf.component').then(c => c.PdfComponent) 
  },

  // 2. Legacy / Specific SEO Routes (Loaded second)
  // E.g., /jpg-to-png 
  { path: ':from-to-:to', component: ConverterComponent },
  
  // 3. Catch-all for 404s (Loaded last)
  { path: '**', redirectTo: '' }
];