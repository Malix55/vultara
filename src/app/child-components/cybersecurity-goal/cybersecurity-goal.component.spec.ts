import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CybersecurityGoalComponent } from './cybersecurity-goal.component';

describe('CybersecurityGoalComponent', () => {
  let component: CybersecurityGoalComponent;
  let fixture: ComponentFixture<CybersecurityGoalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CybersecurityGoalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CybersecurityGoalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
