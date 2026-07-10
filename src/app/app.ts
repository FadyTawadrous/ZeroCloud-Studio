import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router'; // Add RouterLink here

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink], // Add it to your imports array
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('local-converter');
}