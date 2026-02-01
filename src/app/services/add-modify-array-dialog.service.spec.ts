import { TestBed } from '@angular/core/testing';

import { AddModifyArrayDialogService } from './add-modify-array-dialog.service';

describe('AddModifyArrayDialogService', () => {
  let service: AddModifyArrayDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddModifyArrayDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
