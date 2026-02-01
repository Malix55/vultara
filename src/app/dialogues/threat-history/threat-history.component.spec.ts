import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreatHistoryComponent } from './threat-history.component';

describe('ThreatHistoryComponent', () => {
  let component: ThreatHistoryComponent;
  let fixture: ComponentFixture<ThreatHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreatHistoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreatHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
