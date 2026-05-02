import { afterNextRender, Component, TemplateRef, ViewChild } from '@angular/core';
import { LayoutComponent } from '../../components/layout/layout.component';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-contact',
  imports: [LayoutComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  @ViewChild('contactContent', { static: true }) contactContent!: TemplateRef<any>;

  constructor(private contentService: ContentService) {
    afterNextRender(() => {
      if (this.contactContent) {
        this.contentService.setContent(this.contactContent);
      }
    });
  }
}
