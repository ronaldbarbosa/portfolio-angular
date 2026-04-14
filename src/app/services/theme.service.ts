import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';
  private readonly DARK_CLASS = 'dark';

  readonly isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });
  }

  private getInitialTheme(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored !== null) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(isDark: boolean): void {
    const body = document.body;
    if (isDark) {
      body.classList.add(this.DARK_CLASS);
    } else {
      body.classList.remove(this.DARK_CLASS);
    }
    localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');
  }

  toggle(): void {
    this.isDarkMode.update(current => !current);
  }
}
