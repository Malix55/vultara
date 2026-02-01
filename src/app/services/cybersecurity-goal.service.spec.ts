import { TestBed } from '@angular/core/testing';

import { CybersecurityGoalService } from './cybersecurity-goal.service';

describe('CybersecurityGoalService', () => {
  let service: CybersecurityGoalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CybersecurityGoalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
