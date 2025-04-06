import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPuiTooltip]',
  standalone: true
})
export class PuiTooltipDirective implements OnDestroy {
  @Input() tooltipText: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() showDelay: number = 300;
  @Input() hideDelay: number = 100;

  private tooltip: HTMLElement | null = null;
  private showTimeout?: number;
  private hideTimeout?: number;
  private readonly margin: number = 10;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }

    if (!this.tooltip) {
      this.showTimeout = window.setTimeout(() => {
        this.show();
      }, this.showDelay);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = undefined;
    }

    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, this.hideDelay);
  }

  private show(): void {
    if (this.tooltip) return;

    this.tooltip = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltip, 'pui-tooltip');
    this.renderer.addClass(this.tooltip, `tooltip-${this.position}`);

    const text = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltip, text);
    this.renderer.appendChild(document.body, this.tooltip);

    this.setPosition();
  }

  private hide(): void {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }
  }

  private calculateInitialPosition(hostPos: DOMRect, tooltipPos: DOMRect): { top: number; left: number } {
    let top: number, left: number;

    switch (this.position) {
      case 'top':
        top = hostPos.top - tooltipPos.height - this.margin;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'bottom':
        top = hostPos.bottom + this.margin;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'left':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.left - tooltipPos.width - this.margin;
        break;
      case 'right':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.right + this.margin;
        break;
    }

    return { top, left };
  }

  private setPosition(): void {
    if (!this.tooltip) return;

    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltip.getBoundingClientRect();
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { top, left } = this.calculateInitialPosition(hostPos, tooltipPos);
    let position = this.position;

    top += scrollPos;

    if (position === 'left' && left < this.margin) {
      position = 'right';
      left = hostPos.right + this.margin;
    } else if (position === 'right' && left + tooltipPos.width > viewportWidth - this.margin) {

      position = 'left';
      left = hostPos.left - tooltipPos.width - this.margin;
    } else if (left < this.margin) {
      left = this.margin;
    } else if (left + tooltipPos.width > viewportWidth - this.margin) {
      left = viewportWidth - tooltipPos.width - this.margin;
    }

    if (top - scrollPos < this.margin) {
      if (position === 'top' && hostPos.bottom + tooltipPos.height + this.margin < viewportHeight) {
        position = 'bottom';
        top = hostPos.bottom + this.margin + scrollPos;
      } else {
        top = scrollPos + this.margin;
      }
    } else if (top - scrollPos + tooltipPos.height > viewportHeight - this.margin) {
      if (position === 'bottom' && hostPos.top - tooltipPos.height - this.margin > 0) {
        position = 'top';
        top = hostPos.top - tooltipPos.height - this.margin + scrollPos;
      } else {
        top = scrollPos + viewportHeight - tooltipPos.height - this.margin;
      }
    }

    this.renderer.removeClass(this.tooltip, `tooltip-${this.position}`);
    this.renderer.addClass(this.tooltip, `tooltip-${position}`);


    this.renderer.setStyle(this.tooltip, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }

  ngOnDestroy(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hide();
  }
}
