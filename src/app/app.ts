import { Component, signal, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgbCollapseModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('local-converter');
  private platformId = inject(PLATFORM_ID);
  isDarkMode = false;
  isNavCollapsed = true;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        this.setTheme(true);
      }
    }
  }

  toggleTheme() {
    this.setTheme(!this.isDarkMode);
  }

  private setTheme(dark: boolean) {
    this.isDarkMode = dark;
    if (isPlatformBrowser(this.platformId)) {
      const themeValue = dark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-bs-theme', themeValue);
      localStorage.setItem('theme', themeValue);
    }
  }

}