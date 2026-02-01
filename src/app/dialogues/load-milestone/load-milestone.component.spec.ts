import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadMilestoneComponent } from './load-milestone.component';

describe('LoadMilestoneComponent', () => {
  let component: LoadMilestoneComponent;
  let fixture: ComponentFixture<LoadMilestoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadMilestoneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadMilestoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
