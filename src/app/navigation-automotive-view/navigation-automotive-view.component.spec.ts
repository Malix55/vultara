import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationAutomotiveViewComponent } from './navigation-automotive-view.component';

describe('NavigationAutomotiveViewComponent', () => {
  let component: NavigationAutomotiveViewComponent;
  let fixture: ComponentFixture<NavigationAutomotiveViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavigationAutomotiveViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationAutomotiveViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
