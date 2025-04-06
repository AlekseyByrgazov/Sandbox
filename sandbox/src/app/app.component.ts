import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PuiTooltipDirective } from '../directives/pui-tooltip.directive';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PuiTooltipDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'sandbox';
}
