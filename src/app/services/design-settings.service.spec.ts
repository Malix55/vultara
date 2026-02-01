import { TestBed } from '@angular/core/testing';

import { DesignSettingsService } from './design-settings.service';

describe('DesignSettingsService', () => {
  let service: DesignSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DesignSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
