import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { MainComponent } from "./main/main.component";

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, FooterComponent, MainComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent { }
