import { Injectable, TemplateRef, WritableSignal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ContentService {
  // Explicitamente como WritableSignal
  private contentSignal: WritableSignal<TemplateRef<any> | null> = signal<TemplateRef<any> | null>(null);

  // Getter público readonly
  readonly content = this.contentSignal.asReadonly();

  setContent(template: TemplateRef<any> | null) {
    this.contentSignal.set(template);
  }
}
