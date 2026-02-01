import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlBeforeConfirmationComponent } from './control-before-confirmation.component';

describe('ControlBeforeConfirmationComponent', () => {
  let component: ControlBeforeConfirmationComponent;
  let fixture: ComponentFixture<ControlBeforeConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlBeforeConfirmationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlBeforeConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
