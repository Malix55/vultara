import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddModifyArrayDialogComponent } from './add-modify-array-dialog.component';

describe('AddModifyArrayDialogComponent', () => {
  let component: AddModifyArrayDialogComponent;
  let fixture: ComponentFixture<AddModifyArrayDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddModifyArrayDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddModifyArrayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
