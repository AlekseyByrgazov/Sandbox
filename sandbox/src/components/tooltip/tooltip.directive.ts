import {
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { PuiTooltip } from './tooltip.component';

export type TooltipPlacement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right'
  | 'top'
  | 'top-start'
  | 'top-end';

interface OffsetPosition {
  top: number;
  left: number;
}

@Directive({
  selector: '[puiTooltip]',
  standalone: true,
})
export class PuiTooltipDirective implements OnDestroy {
  /*Устанавливает текстовое сообщение внутри тултипа*/ 
  @Input('puiTooltip') tooltipText: string | undefined;

  /*Устанавливает расположение тултипа относительно элемента, к которому требуется пояснение.*/ 
  @Input() tooltipPlacement: TooltipPlacement = 'bottom';

  /*Устанавливает задержку перед демонстрацией тултипа. Указывается в ms.*/ 
  @Input() tooltipShowDelay = 300;

  /*Устанавливает задержку сокрытия тултипа. Указывается в ms.*/ 
  @Input() tooltipHideDelay = 3000;

  /*Устанавливает размер отступа между целью наведения и тултипом. Указывается в px.*/ 
  @Input() tooltipOffset = 6;

  private _tooltipContainerRef: ComponentRef<PuiTooltip> | null = null;
  private _showTimeout?: number;
  private _hideTimeout?: number;
  private _tooltipId!: string;
  private static activeTooltips = new Map<string, PuiTooltipDirective>();

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private viewContainerRef: ViewContainerRef
  ) {
    this._tooltipId = this._generateRandomId();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    PuiTooltipDirective.activeTooltips.forEach((tooltip, id) => {
      if (id !== this._tooltipId) {
        tooltip._hide();
      }
    });
    PuiTooltipDirective.activeTooltips.set(this._tooltipId, this);

    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = undefined;
    }
    if (!this._tooltipContainerRef) {
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
      PuiTooltipDirective.activeTooltips.delete(this._tooltipId);
    }, this.tooltipHideDelay);
  }

  private _show(): void {
    if (this._tooltipContainerRef) return;

    this._tooltipContainerRef =
      this.viewContainerRef.createComponent(PuiTooltip);
      if(this.tooltipText) {
        this._tooltipContainerRef.instance.text = this.tooltipText;
      }
    this._tooltipContainerRef.changeDetectorRef.detectChanges();
    this.renderer.appendChild(
      document.body,
      this._tooltipContainerRef.location.nativeElement
    );

    this._setPlacement();
  }

  private _hide(): void {
    if (this._tooltipContainerRef) {
      this.renderer.removeChild(
        document.body,
        this._tooltipContainerRef.location.nativeElement
      );
      this._tooltipContainerRef.destroy();
      this._tooltipContainerRef = null;
    }
  }

  private _setPlacement(): void {
    if (!this._tooltipContainerRef) return;

    const hostPositionRect: DOMRect =
      this.el.nativeElement.getBoundingClientRect();
    const tooltipPositionRect: DOMRect =
      this._tooltipContainerRef.location.nativeElement.getBoundingClientRect();
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
      left =
        hostPositionRect.left - tooltipPositionRect.width - this.tooltipOffset;
    }

    if (
      (placement === 'bottom' ||
        placement === 'bottom-end' ||
        placement === 'bottom-start') &&
      viewportHeight - hostPositionRect.bottom <
        tooltipPositionRect.height + this.tooltipOffset
    ) {
      top =
        hostPositionRect.top -
        tooltipPositionRect.height -
        this.tooltipOffset +
        scrollPosition;
    }

    if (
      (placement === 'top' ||
        placement === 'top-end' ||
        placement === 'top-start') &&
      hostPositionRect.top - scrollPosition <
        tooltipPositionRect.height + this.tooltipOffset
    ) {
      top = hostPositionRect.bottom + this.tooltipOffset + scrollPosition;
    }
    this.renderer.setStyle(
      this._tooltipContainerRef.location.nativeElement,
      'top',
      `${top}px`
    );
    this.renderer.setStyle(
      this._tooltipContainerRef.location.nativeElement,
      'left',
      `${left}px`
    );
  }

  private _defineInitialPlacement(
    hostPositionRect: DOMRect,
    tooltipPositionRect: DOMRect
  ): OffsetPosition {
    const offsetPosition: OffsetPosition = { top: 0, left: 0 };
    const deltaHostTooltipWidth =
      hostPositionRect.width - tooltipPositionRect.width;
    const deltaHostTooltipHeight =
      hostPositionRect.height - tooltipPositionRect.height;

    switch (this.tooltipPlacement) {
      case 'bottom':
        offsetPosition.top = hostPositionRect.bottom + this.tooltipOffset;
        offsetPosition.left = hostPositionRect.left + deltaHostTooltipWidth / 2;
        break;
      case 'bottom-start':
        offsetPosition.top = hostPositionRect.bottom + this.tooltipOffset;
        offsetPosition.left = hostPositionRect.left;
        break;
      case 'bottom-end':
        offsetPosition.top = hostPositionRect.bottom + this.tooltipOffset;
        offsetPosition.left = hostPositionRect.right - tooltipPositionRect.width;
        break;
      case 'left':
        offsetPosition.top = hostPositionRect.top + deltaHostTooltipHeight / 2;
        offsetPosition.left =
          hostPositionRect.left -
          tooltipPositionRect.width -
          this.tooltipOffset;
        break;
      case 'right':
        offsetPosition.top = hostPositionRect.top + deltaHostTooltipHeight / 2;
        offsetPosition.left = hostPositionRect.right + this.tooltipOffset;
        break;
      case 'top':
        offsetPosition.top =
          hostPositionRect.top -
          tooltipPositionRect.height -
          this.tooltipOffset;
        offsetPosition.left = hostPositionRect.left + deltaHostTooltipWidth / 2;
        break;
      case 'top-start':
        offsetPosition.top =
          hostPositionRect.top -
          tooltipPositionRect.height -
          this.tooltipOffset;
        offsetPosition.left = hostPositionRect.left;
        break;
      case 'top-end':
        offsetPosition.top =
          hostPositionRect.top -
          tooltipPositionRect.height -
          this.tooltipOffset;
        offsetPosition.left = hostPositionRect.right - tooltipPositionRect.width;
        break;
    }

    return offsetPosition;
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
    PuiTooltipDirective.activeTooltips.delete(this._tooltipId);
  }
}
