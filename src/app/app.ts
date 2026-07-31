import { Component, signal, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

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
  protected readonly currentYear = new Date().getFullYear();
  private swUpdate = inject(SwUpdate);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        this.setTheme(true);
      }
    }

    // 1. Check if the Service Worker is actually enabled (it won't be in 'ng serve')
    if (this.swUpdate.isEnabled) {
      // 2. Listen for background updates
      this.swUpdate.versionUpdates
        .pipe(
          // 3. Filter the events so we only react when the download is 100% complete
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
        )
        .subscribe(() => {
          // 4. Prompt the user to reload
          if (confirm('A new version of the app is available. Load the new version?')) {
            window.location.reload();
          }
        });
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