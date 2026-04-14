import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private readonly themeService = inject(ThemeService);
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly toggle = () => this.themeService.toggle();
}
