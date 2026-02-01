import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBOMComponent } from './create-bom.component';

describe('CreateBOMComponent', () => {
  let component: CreateBOMComponent;
  let fixture: ComponentFixture<CreateBOMComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateBOMComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateBOMComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
