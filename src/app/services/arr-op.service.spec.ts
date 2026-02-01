import { TestBed } from '@angular/core/testing';

import { ArrOpService } from './arr-op.service';

describe('ArrOpService', () => {
  let service: ArrOpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArrOpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
