import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteThreatComponent } from './delete-threat.component';

describe('DeleteThreatComponent', () => {
  let component: DeleteThreatComponent;
  let fixture: ComponentFixture<DeleteThreatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteThreatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteThreatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
