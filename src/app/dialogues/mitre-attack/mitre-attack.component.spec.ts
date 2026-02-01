import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitreAttackComponent } from './mitre-attack.component';

describe('MitreAttackComponent', () => {
  let component: MitreAttackComponent;
  let fixture: ComponentFixture<MitreAttackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitreAttackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitreAttackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
