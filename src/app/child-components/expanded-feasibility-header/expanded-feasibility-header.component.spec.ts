import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandedFeasibilityHeaderComponent } from './expanded-feasibility-header.component';

describe('ExpandedFeasibilityHeaderComponent', () => {
  let component: ExpandedFeasibilityHeaderComponent;
  let fixture: ComponentFixture<ExpandedFeasibilityHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpandedFeasibilityHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpandedFeasibilityHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
