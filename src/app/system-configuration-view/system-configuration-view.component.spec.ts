import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemConfigurationViewComponent } from './system-configuration-view.component';

describe('SystemConfigurationViewComponent', () => {
  let component: SystemConfigurationViewComponent;
  let fixture: ComponentFixture<SystemConfigurationViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SystemConfigurationViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemConfigurationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
