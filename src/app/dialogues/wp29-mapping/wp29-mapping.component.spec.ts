import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Wp29MappingComponent } from './wp29-mapping.component';

describe('Wp29MappingComponent', () => {
  let component: Wp29MappingComponent;
  let fixture: ComponentFixture<Wp29MappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Wp29MappingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Wp29MappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
