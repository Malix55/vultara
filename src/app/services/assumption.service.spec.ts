import { TestBed } from '@angular/core/testing';

import { AssumptionService } from './assumption.service';

describe('AssumptionService', () => {
  let service: AssumptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssumptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
