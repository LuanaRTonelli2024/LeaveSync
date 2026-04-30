import { TestBed } from '@angular/core/testing';

import { LeavePolicy } from './leave-policy';

describe('LeavePolicy', () => {
  let service: LeavePolicy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeavePolicy);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
