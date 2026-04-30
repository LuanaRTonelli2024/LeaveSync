import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestTimeOff } from './request-time-off';

describe('RequestTimeOff', () => {
  let component: RequestTimeOff;
  let fixture: ComponentFixture<RequestTimeOff>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestTimeOff],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestTimeOff);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
