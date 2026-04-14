import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect } from '@angular/core';
import { ContentService } from '../../../services/content.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent {
  hasContent = false;

  constructor(public contentService: ContentService, private cdr: ChangeDetectorRef) {
    effect(() => {
      const content = this.contentService.content();
      this.hasContent = !!content;
      this.cdr.markForCheck(); // Força detecção de mudanças
    });
  }
}
