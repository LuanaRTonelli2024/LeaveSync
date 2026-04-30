import { TestBed } from '@angular/core/testing';

import { TimeOff } from './time-off';

describe('TimeOff', () => {
  let service: TimeOff;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeOff);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
