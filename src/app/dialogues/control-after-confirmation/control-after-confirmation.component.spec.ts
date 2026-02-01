import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlAfterConfirmationComponent } from './control-after-confirmation.component';

describe('ControlAfterConfirmationComponent', () => {
  let component: ControlAfterConfirmationComponent;
  let fixture: ComponentFixture<ControlAfterConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlAfterConfirmationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlAfterConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
