import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelingResultsComponent } from './modeling-results.component';

describe('ModelingResultsComponent', () => {
  let component: ModelingResultsComponent;
  let fixture: ComponentFixture<ModelingResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelingResultsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelingResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
