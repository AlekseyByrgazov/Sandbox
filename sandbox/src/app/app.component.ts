import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PuiTooltipBase } from '../components/tooltip/tooltip.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PuiTooltipBase],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'sandbox';
}
