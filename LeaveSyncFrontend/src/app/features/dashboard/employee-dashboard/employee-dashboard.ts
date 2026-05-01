import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Auth } from '../../../core/services/auth';
import { TimeOff } from '../../../core/services/time-off';
import { LeavePolicyService } from '../../../core/services/leave-policy';
import { RealtimeService } from '../../../core/services/realtime';
import { TimeOffRequest } from '../../../core/models/time-off-request';
import { User } from '../../../core/models/user';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.scss',
})
export class EmployeeDashboard implements OnDestroy {
  private readonly authService = inject(Auth);
  private readonly timeOffService = inject(TimeOff);
  private readonly leavePolicyService = inject(LeavePolicyService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly router = inject(Router);

  readonly currentUser = computed(() => this.authService.currentUser() as User | null);

  readonly requests = signal<TimeOffRequest[]>([]);

  readonly vacationBalance = signal<number>(0);
  readonly sickBalance = signal<number>(0);
  readonly totalVacationDays = signal<number>(0);
  readonly totalSickDays = signal<number>(0);

  readonly isLoading = signal(true);
  readonly pageError = signal('');

  constructor() {
    this.loadDashboard();
    this.loadBalances();

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

    this.timeOffService.getMyRequests()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.requests.set(response.data.requests);
          this.recalcBalances();
        },
        error: (error) => {
          this.pageError.set(error.error?.message ?? 'Could not load the dashboard.');
        },
      });
  }

  private loadBalances(): void {
    this.leavePolicyService.getMyBalance().subscribe({
      next: (response) => {
        this.totalVacationDays.set(response.data.vacationDays);
        this.totalSickDays.set(response.data.sickDays);
        this.recalcBalances();
      },
      error: (error) => {
        this.pageError.set(error.error?.message ?? 'Could not load leave balance.');
      },
    });
  }

  private recalcBalances(): void {
    const approved = this.requests().filter(r => r.status === 'approved');
    const usedVacation = approved.filter(r => r.type === 'vacation').reduce((acc, r) => acc + r.totalDays, 0);
    const usedSick = approved.filter(r => r.type === 'sick').reduce((acc, r) => acc + r.totalDays, 0);
    this.vacationBalance.set(this.totalVacationDays() - usedVacation);
    this.sickBalance.set(this.totalSickDays() - usedSick);
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
    this.timeOffService.getMyRequests().subscribe({
      next: (response) => {
        this.requests.set(response.data.requests);
        this.recalcBalances();
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