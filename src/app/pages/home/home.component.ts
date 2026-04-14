import { afterNextRender, Component, TemplateRef, ViewChild } from '@angular/core';
import { LayoutComponent } from '../../components/layout/layout.component';
import { ContentService } from '../../services/content.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [NgOptimizedImage, LayoutComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @ViewChild('homeContent', { static: true }) homeContent!: TemplateRef<any>;
  imagemUrl = '/images/perfil.png';
  nomeArquivo = 'foto-perfil';

  constructor(private contentService: ContentService) {
    // afterNextRender garante que o DOM está pronto
    afterNextRender(() => {
      if (this.homeContent) {
        this.contentService.setContent(this.homeContent);
      }
    });
  }
}
