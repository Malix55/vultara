import { TestBed } from '@angular/core/testing';

import { SingleInputFormDialogService } from './single-input-form-dialog.service';

describe('SingleInputFormDialogService', () => {
  let service: SingleInputFormDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SingleInputFormDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
