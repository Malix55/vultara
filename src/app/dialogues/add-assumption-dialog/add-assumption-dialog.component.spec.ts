import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAssumptionDialogComponent } from './add-assumption-dialog.component';

describe('AddAssumptionDialogComponent', () => {
  let component: AddAssumptionDialogComponent;
  let fixture: ComponentFixture<AddAssumptionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAssumptionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAssumptionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
