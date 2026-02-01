import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsDetailsComponent } from './details.component';

describe('NotificationsComponent', () => {
  let component: NotificationsDetailsComponent;
  let fixture: ComponentFixture<NotificationsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationsDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
