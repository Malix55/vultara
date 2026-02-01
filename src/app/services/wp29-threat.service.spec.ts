import { TestBed } from '@angular/core/testing';

import { Wp29ThreatService } from './wp29-threat.service';

describe('Wp29ThreatService', () => {
  let service: Wp29ThreatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Wp29ThreatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
