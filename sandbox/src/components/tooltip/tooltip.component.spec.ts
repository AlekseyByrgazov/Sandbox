import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuiTooltip } from './tooltip.component';

describe('PuiTooltip', () => {
  let component: PuiTooltip;
  let fixture: ComponentFixture<PuiTooltip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuiTooltip]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PuiTooltip);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
