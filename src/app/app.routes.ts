import { Routes } from '@angular/router';
import { ConverterComponent } from './features/converter.component/converter.component';

export const routes: Routes = [
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

  // 2. Updated: Catch the full string as "conversion"
  { path: ':conversion', component: ConverterComponent },

  // 3. Catch-all for 404s
  { path: '**', redirectTo: '' }
];