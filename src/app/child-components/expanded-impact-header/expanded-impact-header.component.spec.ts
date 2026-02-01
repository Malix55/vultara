import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandedImpactHeaderComponent } from './expanded-impact-header.component';

describe('ExpandedImpactHeaderComponent', () => {
  let component: ExpandedImpactHeaderComponent;
  let fixture: ComponentFixture<ExpandedImpactHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpandedImpactHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpandedImpactHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
