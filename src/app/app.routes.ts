import { Routes } from '@angular/router';
import { ConverterComponent } from './features/converter.component/converter.component';

export const routes: Routes = [
    // This captures the exact formats from the URL
  { path: ':from-to-:to', component: ConverterComponent },
  
  // A generic fallback for the homepage
  { path: '', component: ConverterComponent },
  
  // Catch-all for 404s
  { path: '**', redirectTo: '' }
];
