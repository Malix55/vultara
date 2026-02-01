import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterGoalsComponent } from './filter-goals.component';

describe('FilterGoalsComponent', () => {
  let component: FilterGoalsComponent;
  let fixture: ComponentFixture<FilterGoalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterGoalsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterGoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
