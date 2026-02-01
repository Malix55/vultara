import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeaknessViewComponent } from './weakness-view.component';

describe('WeaknessViewComponent', () => {
  let component: WeaknessViewComponent;
  let fixture: ComponentFixture<WeaknessViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeaknessViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeaknessViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
