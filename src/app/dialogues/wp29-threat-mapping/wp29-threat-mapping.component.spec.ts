import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Wp29ThreatMappingComponent } from './wp29-threat-mapping.component';

describe('Wp29ThreatMappingComponent', () => {
  let component: Wp29ThreatMappingComponent;
  let fixture: ComponentFixture<Wp29ThreatMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Wp29ThreatMappingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Wp29ThreatMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
