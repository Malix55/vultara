import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAssumptionComponent } from './delete-assumption.component';

describe('DeleteAssumptionComponent', () => {
  let component: DeleteAssumptionComponent;
  let fixture: ComponentFixture<DeleteAssumptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteAssumptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAssumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
