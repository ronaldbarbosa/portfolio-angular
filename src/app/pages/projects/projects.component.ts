import { afterNextRender, Component, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { LayoutComponent } from '../../components/layout/layout.component';
import { ContentService } from '../../services/content.service';
import { ProjectsService } from '../../services/projects.service';
import { Project } from '../../models/project.model';
import { PaginatedResponse } from '../../models/paginatedResponse.model';

@Component({
  selector: 'app-projects',
  imports: [LayoutComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent {
  @ViewChild('projectsContent', { static: true }) projectsContent!: TemplateRef<any>;

  private readonly contentService = inject(ContentService);
  private readonly projectsService = inject(ProjectsService);

  projects = signal<Project[]>([]);
  pagination = signal<Omit<PaginatedResponse<Project>, 'items'> | null>(null);
  loading = signal(true);
  currentPage = signal(1);

  constructor() {
    afterNextRender(() => {
      this.contentService.setContent(this.projectsContent);
      this.loadProjects(1);
    });
  }

  loadProjects(page: number): void {
    this.loading.set(true);
    this.projectsService.getProjects(page).subscribe({
      next: ({ items, ...meta }) => {
        this.projects.set(items);
        this.pagination.set(meta);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  splitTools(tools: string): string[] {
    return tools.split(',').map(t => t.trim()).filter(Boolean);
  }
}
