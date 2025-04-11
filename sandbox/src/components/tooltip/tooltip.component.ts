import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  createComponent,
  Directive,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { TooltipService } from './tooltip.service';
import { Subscription } from 'rxjs';

export type TooltipPlacement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right'
  | 'top'
  | 'top-start'
  | 'top-end';

interface TLMargins {
  top: number;
  left: number;
};

@Directive({
  selector: '[puiTooltip]',
  standalone: true
})
export class PuiTooltipBase implements OnDestroy {
  @Input() tooltipText = '';
  @Input() tooltipPlacement: TooltipPlacement = 'bottom';
  @Input() tooltipShowDelay = 300;
  @Input() tooltipHideDelay = 3000;
  @Input() tooltipOffset = 6;

  private _tooltipContainer: HTMLElement | null = null;
  private _tooltipContainerRef: ComponentRef<PuiTooltipComponent> | null = null;
  private _showTimeout?: number;
  private _hideTimeout?: number;
  private _tooltipId!: string;
  private _activeTooltipSubscription!: Subscription;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private tooltipService: TooltipService,
    private viewContainerRef: ViewContainerRef,
    private injector: EnvironmentInjector
  ) {
    this._tooltipId = this._generateRandomId();

    this._activeTooltipSubscription =
      this.tooltipService.activeTooltip$.subscribe((id) => {
        if (id !== this._tooltipId && this._tooltipContainer) {
          this._hide();
        }
      });
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.tooltipService.setActiveTooltip(this._tooltipId);

    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = undefined;
    }
    if (!this._tooltipContainer) {
      this._showTimeout = window.setTimeout(() => {
        this._show();
      }, this.tooltipShowDelay);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
      this._showTimeout = undefined;
    }

    this._hideTimeout = window.setTimeout(() => {
      this._hide();
    }, this.tooltipHideDelay);
  }

  private _show(): void {
    if (this._tooltipContainer) return;

    this._tooltipContainer = this.renderer.createElement('div');
    this.renderer.addClass(this._tooltipContainer, 'pui-tooltip');
    this.renderer.setAttribute(this._tooltipContainer, 'tooltip-id', this._tooltipId);

    this.renderer.setStyle(this._tooltipContainer, 'position', 'absolute');
    this.renderer.setStyle(this._tooltipContainer, 'z-index', '1000');
    this.renderer.setStyle(this._tooltipContainer, 'pointer-events', 'none');

    this._tooltipContainerRef = createComponent(PuiTooltipComponent, {
      environmentInjector: this.injector,
      elementInjector: this.viewContainerRef.injector
    });
    this._tooltipContainerRef.instance.text = this.tooltipText;

    this._tooltipContainerRef.changeDetectorRef.detectChanges();

    this.renderer.appendChild(
      this._tooltipContainer,
      this._tooltipContainerRef.location.nativeElement
    );

    this.renderer.appendChild(document.body, this._tooltipContainer);
    this._setPlacement();
  }

  private _hide(): void {
    if (this._tooltipContainer) {
      this.renderer.removeChild(document.body, this._tooltipContainer);
      this._tooltipContainer = null;
    }
    if(this._tooltipContainerRef){
      this._tooltipContainerRef.destroy();
      this._tooltipContainerRef = null;
    }
  }

  private _setPlacement(): void {
    if (!this._tooltipContainer) return;

    const hostPositionRect: DOMRect =
      this.el.nativeElement.getBoundingClientRect();
    const tooltipPositionRect: DOMRect = this._tooltipContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollPosition = window.pageYOffset || 0;

    let { top, left } = this._defineInitialPlacement(
      hostPositionRect,
      tooltipPositionRect
    );
    const placement = this.tooltipPlacement;

    top += scrollPosition;

    if (
      placement === 'left' &&
      hostPositionRect.left < tooltipPositionRect.width + this.tooltipOffset
    ) {
      left = hostPositionRect.right + this.tooltipOffset;
    }

    if (
      placement === 'right' &&
      viewportWidth - hostPositionRect.right <
        tooltipPositionRect.width + this.tooltipOffset
    ) {
      left = hostPositionRect.left - tooltipPositionRect.width - this.tooltipOffset;
    }

    if (
      (placement === 'bottom' ||
        placement === 'bottom-end' ||
        placement === 'bottom-start') &&
      viewportHeight - (hostPositionRect.bottom - scrollPosition) <
        tooltipPositionRect.height + this.tooltipOffset
    ) {
      top = hostPositionRect.top - tooltipPositionRect.height - this.tooltipOffset;
    }

    if (
      (placement === 'top' ||
        placement === 'top-end' ||
        placement === 'top-start') &&
      hostPositionRect.top - scrollPosition <
        tooltipPositionRect.height + this.tooltipOffset
    ) {
      top = hostPositionRect.bottom + this.tooltipOffset;
    }

    this.renderer.setStyle(this._tooltipContainer, 'top', `${top}px`);
    this.renderer.setStyle(this._tooltipContainer, 'left', `${left}px`);
  }

  private _defineInitialPlacement(
    hostPositionRect: DOMRect,
    tooltipPositionRect: DOMRect
  ): TLMargins {
    const TLMargins: TLMargins = { top: 0, left: 0 };
    const deltaHostTooltipWidth =
      hostPositionRect.width - tooltipPositionRect.width;
    const deltaHostTooltipHeight =
      hostPositionRect.height - tooltipPositionRect.height;

    switch (this.tooltipPlacement) {
      case 'bottom':
        TLMargins.top = hostPositionRect.bottom + this.tooltipOffset;
        TLMargins.left = hostPositionRect.left + deltaHostTooltipWidth / 2;
        break;
      case 'bottom-start':
        TLMargins.top = hostPositionRect.bottom + this.tooltipOffset;
        TLMargins.left = hostPositionRect.left;
        break;
      case 'bottom-end':
        TLMargins.top = hostPositionRect.bottom + this.tooltipOffset;
        TLMargins.left = hostPositionRect.right - tooltipPositionRect.width;
        break;
      case 'left':
        TLMargins.top = hostPositionRect.top + deltaHostTooltipHeight / 2;
        TLMargins.left =
          hostPositionRect.left - tooltipPositionRect.width - this.tooltipOffset;
        break;
      case 'right':
        TLMargins.top = hostPositionRect.top + deltaHostTooltipHeight / 2;
        TLMargins.left = hostPositionRect.right + this.tooltipOffset;
        break;
      case 'top':
        TLMargins.top =
          hostPositionRect.top - tooltipPositionRect.height - this.tooltipOffset;
        TLMargins.left = hostPositionRect.left + deltaHostTooltipWidth / 2;
        break;
      case 'top-start':
        TLMargins.top =
          hostPositionRect.top - tooltipPositionRect.height - this.tooltipOffset;
        TLMargins.left = hostPositionRect.left;
        break;
      case 'top-end':
        TLMargins.top =
          hostPositionRect.top - tooltipPositionRect.height - this.tooltipOffset;
        TLMargins.left = hostPositionRect.right - tooltipPositionRect.width;
        break;
    }

    return TLMargins;
  }

  private _generateRandomId() {
    return Math.random().toString(36).substring(2, 9);
  }

  private _destroyTimeouts() {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
    }

    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
    }
  }

  ngOnDestroy(): void {
    this._destroyTimeouts();
    this._hide();

    if (this._activeTooltipSubscription) {
      this._activeTooltipSubscription.unsubscribe();
    }
  }
}

@Component({
  selector: 'pui-tooltip',
  standalone: true,
  template: `<div class="tooltip-content">{{ text }}</div>`,
  styles: [`
    :host {
      display: block;
    }

    .tooltip-content {
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.4;
      white-space: nowrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PuiTooltipComponent {
  @Input() text: string = '';
}