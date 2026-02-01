import { TestBed } from '@angular/core/testing';

import { ResultSharingService } from './result-sharing.service';

describe('ResultSharingService', () => {
  let service: ResultSharingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResultSharingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
