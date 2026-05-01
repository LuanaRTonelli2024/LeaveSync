import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Auth } from '../../../core/services/auth';
import { TimeOff } from '../../../core/services/time-off';
import { LeavePolicyService } from '../../../core/services/leave-policy';
import { RealtimeService } from '../../../core/services/realtime';
import { TimeOffRequest } from '../../../core/models/time-off-request';
import { LeavePolicy } from '../../../core/models/leave-policy';
import { User } from '../../../core/models/user';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnDestroy {
  private readonly authService = inject(Auth);
  private readonly timeOffService = inject(TimeOff);
  private readonly leavePolicyService = inject(LeavePolicyService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.authService.currentUser() as User | null);

  readonly allRequests = signal<TimeOffRequest[]>([]);
  readonly pendingRequests = signal<TimeOffRequest[]>([]);
  readonly myRequests = signal<TimeOffRequest[]>([]);

  readonly vacationBalance = signal<number>(0);
  readonly sickBalance = signal<number>(0);
  readonly totalVacationDays = signal<number>(0);
  readonly totalSickDays = signal<number>(0);

  readonly currentMonth = signal<number>(new Date().getMonth());
  readonly currentYear = signal<number>(new Date().getFullYear());

  readonly isLoading = signal(true);
  readonly pageError = signal('');

  // Leave policy management
  readonly vacationPolicies = signal<LeavePolicy[]>([]);
  readonly sickPolicies = signal<LeavePolicy[]>([]);
  readonly policyError = signal('');

  readonly newVacationMinYears = signal<number>(0);
  readonly newVacationTotalDays = signal<number>(0);
  readonly newSickTotalDays = signal<number>(0);

  constructor() {
    this.loadDashboard();
    this.loadBalances();
    this.loadPolicies();

    this.realtimeService.connect(
      () => this.refreshRequests(),
      () => this.refreshRequests(),
      () => this.refreshRequests()
    );
  }

  ngOnDestroy(): void {
    this.realtimeService.disconnect();
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
          this.pendingRequests.set(
            all
              .filter(r => r.status === 'pending')
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          );
          const myId = this.currentUser()?._id;
          const mine = all.filter(r => r.userId === myId);
          this.myRequests.set(mine);
        },
        error: (error) => {
          this.pageError.set(error.error?.message ?? 'Could not load the dashboard.');
        },
      });
  }

  loadBalances(): void {
    this.leavePolicyService.getMyBalance().subscribe({
      next: (response) => {
        this.vacationBalance.set(response.data.vacationDays);
        this.sickBalance.set(response.data.sickDays);
        this.totalVacationDays.set(response.data.totalVacationDays);
        this.totalSickDays.set(response.data.totalSickDays);
      },
      error: (error) => {
        this.pageError.set(error.error?.message ?? 'Could not load leave balance.');
      },
    });
  }

  // Policy management
  loadPolicies(): void {
    this.leavePolicyService.getPolicies().subscribe({
      next: (response) => {
        const policies = response.data.policies;
        this.vacationPolicies.set(policies.filter(p => p.type === 'vacation'));
        this.sickPolicies.set(policies.filter(p => p.type === 'sick'));
      },
      error: () => {
        this.policyError.set('Could not load policies.');
      },
    });
  }

  addVacationPolicy(): void {
    const minYears = this.newVacationMinYears();
    const totalDays = this.newVacationTotalDays();

    if (minYears < 0 || totalDays <= 0) {
      this.policyError.set('Please enter valid values for the vacation policy.');
      return;
    }

    this.policyError.set('');
    this.leavePolicyService.createPolicy({ type: 'vacation', minYears, totalDays }).subscribe({
      next: () => {
        this.newVacationMinYears.set(0);
        this.newVacationTotalDays.set(0);
        this.loadPolicies();
        this.loadBalances();
      },
      error: () => {
        this.policyError.set('Could not add vacation policy.');
      },
    });
  }

  deleteVacationPolicy(policyId: string): void {
    this.leavePolicyService.deletePolicy(policyId).subscribe({
      next: () => {
        this.loadPolicies();
        this.loadBalances();
      },
      error: () => {
        this.policyError.set('Could not delete vacation policy.');
      },
    });
  }

  saveSickPolicy(): void {
    const totalDays = this.newSickTotalDays();

    if (totalDays <= 0) {
      this.policyError.set('Please enter a valid number of sick days.');
      return;
    }

    this.policyError.set('');
    const existing = this.sickPolicies()[0];

    const action$ = existing
      ? this.leavePolicyService.updatePolicy(existing._id, { totalDays })
      : this.leavePolicyService.createPolicy({ type: 'sick', minYears: 0, totalDays });

    action$.subscribe({
      next: () => {
        this.newSickTotalDays.set(0);
        this.loadPolicies();
        this.loadBalances();
      },
      error: () => {
        this.policyError.set('Could not save sick leave policy.');
      },
    });
  }

  // Calendar
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
        this.loadBalances();
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