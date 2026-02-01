import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelingViewComponent } from './modeling-view.component';

describe('ModelingViewComponent', () => {
  let component: ModelingViewComponent;
  let fixture: ComponentFixture<ModelingViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModelingViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
