import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialsViewComponent } from './materials-view.component';

describe('MaterialsViewComponent', () => {
  let component: MaterialsViewComponent;
  let fixture: ComponentFixture<MaterialsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
