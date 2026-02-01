import { TestBed } from '@angular/core/testing';

import { MitreAttackService } from './mitre-attack.service';

describe('MitreAttackService', () => {
  let service: MitreAttackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MitreAttackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
