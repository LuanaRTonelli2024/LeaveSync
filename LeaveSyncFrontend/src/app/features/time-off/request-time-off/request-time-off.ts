import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Auth } from '../../../core/services/auth';
import { TimeOff } from '../../../core/services/time-off';
import { TimeOffRequest } from '../../../core/models/time-off-request';
import { User } from '../../../core/models/user';

@Component({
  selector: 'app-request-time-off',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './request-time-off.html',
  styleUrl: './request-time-off.scss',
})
export class RequestTimeOff {
  private readonly authService = inject(Auth);
  private readonly timeOffService = inject(TimeOff);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly currentUser = computed(() => this.authService.currentUser());

  readonly editingRequestId = signal<string | null>(null);

  readonly selectedType = signal<'vacation' | 'sick'>('vacation');

  readonly selectedStart = signal<Date | null>(null);
  readonly selectedEnd = signal<Date | null>(null);

  pickerStart = '';
  pickerEnd = '';

  readonly currentMonth = signal<number>(new Date().getMonth());
  readonly currentYear = signal<number>(new Date().getFullYear());

  // MOCK — reemplazar con valores reales del balance del usuario desde el backend
  readonly availableVacationDays = signal<number>(15);
  readonly availableSickDays = signal<number>(5);
  // END MOCK

  readonly isSubmitting = signal(false);
  readonly pageError = signal('');

  readonly maxDays = computed(() =>
    this.selectedType() === 'vacation'
      ? this.availableVacationDays()
      : this.availableSickDays()
  );

  readonly totalSelectedDays = computed(() => {
    const start = this.selectedStart();
    const end = this.selectedEnd();
    if (!start || !end) return 0;
    return this.countWeekdays(start, end);
  });

  constructor() {
    const id = this.route.snapshot.queryParams['id']; //para tomar el id del url
    if (id) {
      this.editingRequestId.set(id);
      this.loadRequestForEditing(id);
    }
  }

  private loadRequestForEditing(id: string): void {
    this.timeOffService.getMyRequests().subscribe({
      next: (response) => {
        const request = response.data.requests.find(r => r._id === id);
        if (request) {
          this.selectedType.set(request.type);
          const start = new Date(request.startDate);
          const end = new Date(request.endDate);
          this.selectedStart.set(start);
          this.selectedEnd.set(end);
          this.pickerStart = this.toDateString(start);
          this.pickerEnd = this.toDateString(end);
          this.currentMonth.set(start.getMonth());
          this.currentYear.set(start.getFullYear());
        }
      },
      error: () => {
        this.pageError.set('Could not load the request for editing.');
      }
    });
  }

  // calendario
  getCalendarDays(): (number | null)[] {
    const firstDay = new Date(this.currentYear(), this.currentMonth(), 1).getDay();
    const daysInMonth = new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  getMonthName(): string {
    return new Date(this.currentYear(), this.currentMonth()).toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.currentMonth.set(this.currentMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
  }

  isWeekend(day: number): boolean {
    const date = new Date(this.currentYear(), this.currentMonth(), day);
    return date.getDay() === 0 || date.getDay() === 6;
  }

  isDaySelected(day: number): boolean {
    if (!day) return false;
    const date = new Date(this.currentYear(), this.currentMonth(), day);
    const start = this.selectedStart();
    const end = this.selectedEnd();
    if (!start) return false;
    if (!end) return date.toDateString() === start.toDateString();
    return date >= start && date <= end;
  }

  isDayStart(day: number): boolean {
    if (!day || !this.selectedStart()) return false;
    return new Date(this.currentYear(), this.currentMonth(), day).toDateString() === this.selectedStart()!.toDateString();
  }

  isDayEnd(day: number): boolean {
    if (!day || !this.selectedEnd()) return false;
    return new Date(this.currentYear(), this.currentMonth(), day).toDateString() === this.selectedEnd()!.toDateString();
  }

  onDayClick(day: number | null): void {
    if (!day || this.isWeekend(day)) return;

    const clicked = new Date(this.currentYear(), this.currentMonth(), day);

    if (!this.selectedStart() || (this.selectedStart() && this.selectedEnd())) {
      this.selectedStart.set(clicked);
      this.selectedEnd.set(null);
      this.pickerStart = this.toDateString(clicked);
      this.pickerEnd = '';
    } else {
      if (clicked < this.selectedStart()!) {
        this.selectedStart.set(clicked);
        this.pickerStart = this.toDateString(clicked);
      } else {
        const days = this.countWeekdays(this.selectedStart()!, clicked);
        if (days > this.maxDays()) {
          this.pageError.set(`You can only select up to ${this.maxDays()} days for this type of leave.`);
          return;
        }
        this.pageError.set('');
        this.selectedEnd.set(clicked);
        this.pickerEnd = this.toDateString(clicked);
      }
    }
  }

  // sincronizacion picker y calendario
  onPickerStartChange(value: string): void {
    if (!value) return;
    const date = new Date(value + 'T00:00:00');
    this.selectedStart.set(date);
    this.selectedEnd.set(null);
    this.pickerEnd = '';
    this.currentMonth.set(date.getMonth());
    this.currentYear.set(date.getFullYear());
    this.pageError.set('');
  }

  onPickerEndChange(value: string): void {
    if (!value || !this.selectedStart()) return;
    const date = new Date(value + 'T00:00:00');
        
    if (date < this.selectedStart()!) {
      this.pageError.set('End date cannot be before start date.');
      return;
    }
    const days = this.countWeekdays(this.selectedStart()!, date);
    if (days > this.maxDays()) {
      this.pageError.set(`You can only select up to ${this.maxDays()} days for this type of leave.`);
      return;
    }
    this.pageError.set('');
    this.selectedEnd.set(date);
    this.currentMonth.set(date.getMonth());
    this.currentYear.set(date.getFullYear());
  }

  onTypeChange(type: 'vacation' | 'sick'): void {
    this.selectedType.set(type);
    this.selectedStart.set(null);
    this.selectedEnd.set(null);
    this.pickerStart = '';
    this.pickerEnd = '';
    this.pageError.set('');
  }

  submit(): void {
    if (!this.selectedStart() || !this.selectedEnd()) {
      this.pageError.set('Please select a start and end date.');
      return;
    }

    if (this.totalSelectedDays() === 0) {
      this.pageError.set('Selected range contains no working days.');
      return;
    }

    this.isSubmitting.set(true);
    this.pageError.set('');

    const payload = {
      type: this.selectedType(),
      startDate: this.toDateString(this.selectedStart()!),
      endDate: this.toDateString(this.selectedEnd()!),
      totalDays: this.totalSelectedDays(),
    };

    const request$ = this.editingRequestId()
      ? this.timeOffService.updateRequest(this.editingRequestId()!, payload)
      : this.timeOffService.createRequest(payload);

    request$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          const role = this.currentUser()?.role;
          this.router.navigateByUrl(role === 'admin' ? '/admin' : '/dashboard');
        },
        error: (error) => {
          this.pageError.set(error.error?.message ?? 'Could not submit the request.');
        },
      });
  }

  goBack(): void {
    const role = this.currentUser()?.role;
    this.router.navigateByUrl(role === 'admin' ? '/admin' : '/dashboard');
  }

  private countWeekdays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}