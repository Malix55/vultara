import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TacticTechniqueComponent } from './tactic-technique.component';

describe('TacticTechniqueComponent', () => {
  let component: TacticTechniqueComponent;
  let fixture: ComponentFixture<TacticTechniqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TacticTechniqueComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TacticTechniqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
