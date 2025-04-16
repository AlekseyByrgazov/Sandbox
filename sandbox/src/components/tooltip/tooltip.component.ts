import { Component, ChangeDetectionStrategy, ViewEncapsulation, Input } from "@angular/core";

@Component({
    selector: 'pui-tooltip',
    standalone: true,
    templateUrl: './tooltip.component.html',
    styleUrl: './tooltip.component.scss',
    host: {class: 'pui-tooltip'},
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
  })
  export class PuiTooltip{
    @Input() text: string | undefined;
  }
