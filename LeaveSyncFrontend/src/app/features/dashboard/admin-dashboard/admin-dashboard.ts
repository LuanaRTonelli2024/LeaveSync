import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Auth } from '../../../core/services/auth';
import { TimeOff } from '../../../core/services/time-off';
import { LeavePolicyService } from '../../../core/services/leave-policy';
import { TimeOffRequest } from '../../../core/models/time-off-request';
import { User } from '../../../core/models/user';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  private readonly authService = inject(Auth);
  private readonly timeOffService = inject(TimeOff);
  private readonly leavePolicyService = inject(LeavePolicyService);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.authService.currentUser() as User | null);

  readonly allRequests = signal<TimeOffRequest[]>([]);

  readonly pendingRequests = signal<TimeOffRequest[]>([]);

  readonly myRequests = signal<TimeOffRequest[]>([]);

  readonly vacationBalance = signal<number>(0);
  readonly sickBalance = signal<number>(0);

  // MOCK — reemplazar con valores de LeavePolicyService
  readonly totalVacationDays = signal<number>(15);
  readonly totalSickDays = signal<number>(5);
  // END MOCK

  readonly currentMonth = signal<number>(new Date().getMonth());
  readonly currentYear = signal<number>(new Date().getFullYear());

  readonly isLoading = signal(true);
  readonly pageError = signal('');

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.pageError.set('');

    this.timeOffService.getRequests()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const all = response.data.requests;
          this.allRequests.set(all);

          this.pendingRequests.set(all.filter(r => r.status === 'pending'));

          const myId = this.currentUser()?._id;
          const mine = all.filter(r => r.userId === myId);
          this.myRequests.set(mine);

          // MOCK — reemplazar con llamada a LeavePolicyService
          this.calculateBalances(mine);
          // END MOCK
        },
        error: (error) => {
          this.pageError.set(error.error?.message ?? 'Could not load the dashboard.');
        },
      });
  }

  // MOCK — este metodo entero se elimina cuando el backend devuelva los balances directamente
  private calculateBalances(requests: TimeOffRequest[]): void {
    const approved = requests.filter(r => r.status === 'approved');
    const usedVacation = approved.filter(r => r.type === 'vacation').reduce((acc, r) => acc + r.totalDays, 0);
    const usedSick = approved.filter(r => r.type === 'sick').reduce((acc, r) => acc + r.totalDays, 0);
    this.vacationBalance.set(this.totalVacationDays() - usedVacation);
    this.sickBalance.set(this.totalSickDays() - usedSick);
  }
  // END MOCK

  getCalendarDays(): (number | null)[] {
    const firstDay = new Date(this.currentYear(), this.currentMonth(), 1).getDay();
    const daysInMonth = new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  getRequestsForDay(day: number | null): TimeOffRequest[] {
    if (!day) return [];
    const date = new Date(this.currentYear(), this.currentMonth(), day);
    return this.allRequests().filter(r => {
      if (r.status !== 'approved') return false;
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      return date >= start && date <= end;
    });
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

  approveRequest(requestId: string): void {
    this.timeOffService.approveRequest(requestId).subscribe({
      next: () => this.refreshRequests(),
      error: (error) => {
        this.pageError.set(error.error?.message ?? 'Could not approve the request.');
      },
    });
  }

  denyRequest(requestId: string): void {
    this.timeOffService.denyRequest(requestId).subscribe({
      next: () => this.refreshRequests(),
      error: (error) => {
        this.pageError.set(error.error?.message ?? 'Could not deny the request.');
      },
    });
  }

  editRequest(request: TimeOffRequest): void {
    this.router.navigate(['/request-time-off'], { queryParams: { id: request._id } });
  }

  cancelRequest(requestId: string): void {
    this.timeOffService.deleteRequest(requestId).subscribe({
      next: () => this.refreshRequests(),
      error: (error) => {
        this.pageError.set(error.error?.message ?? 'Could not cancel the request.');
      },
    });
  }

  private refreshRequests(): void {
    this.timeOffService.getRequests().subscribe({
      next: (response) => {
        const all = response.data.requests;
        this.allRequests.set(all);
        this.pendingRequests.set(all.filter(r => r.status === 'pending'));
        const myId = this.currentUser()?._id;
        const mine = all.filter(r => r.userId === myId);
        this.myRequests.set(mine);
        // MOCK — reemplazar con llamada a LeavePolicyService
        this.calculateBalances(mine);
        // END MOCK
      },
      error: (error) => {
        this.pageError.set(error.error?.message ?? 'Could not reload requests.');
      },
    });
  }

  requestLeave(): void {
    this.router.navigateByUrl('/request-time-off');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}