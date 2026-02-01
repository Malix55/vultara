import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MergeThreatConfirmationComponent } from './merge-threat-confirmation.component';

describe('MergeThreatConfirmationComponent', () => {
  let component: MergeThreatConfirmationComponent;
  let fixture: ComponentFixture<MergeThreatConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MergeThreatConfirmationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MergeThreatConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
