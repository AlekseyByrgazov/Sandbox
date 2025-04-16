import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PuiTooltipDirective } from '../components/tooltip';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PuiTooltipDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'sandbox';
}
