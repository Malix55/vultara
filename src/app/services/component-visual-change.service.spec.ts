import { TestBed } from '@angular/core/testing';

import { ComponentVisualChangeService } from './component-visual-change.service';

describe('ComponentVisualChangeService', () => {
  let service: ComponentVisualChangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentVisualChangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
