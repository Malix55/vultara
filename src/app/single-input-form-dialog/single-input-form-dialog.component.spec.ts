import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleInputFormDialogComponent } from './single-input-form-dialog.component';

describe('SingleInputFormDialogComponent', () => {
  let component: SingleInputFormDialogComponent;
  let fixture: ComponentFixture<SingleInputFormDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleInputFormDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleInputFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
