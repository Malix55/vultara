import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreThreatsComponent } from './restore-threats.component';

describe('RestoreThreatsComponent', () => {
  let component: RestoreThreatsComponent;
  let fixture: ComponentFixture<RestoreThreatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RestoreThreatsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RestoreThreatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
