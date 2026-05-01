import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { LeavePolicy } from '../models/leave-policy';

interface ApiResponse<T> {
  data: T;
}

interface LeavePolicyPayload {
  type?: 'vacation' | 'sick';
  totalDays?: number;
  minYears?: number;
  description?: string;
}

interface MyBalance {
  vacationDays: number;
  sickDays: number;
  yearsOfService: number;
}

@Injectable({
  providedIn: 'root',
})
export class LeavePolicyService {
  private readonly http = inject(HttpClient);

  getPolicies() {
    return this.http.get<ApiResponse<{ policies: LeavePolicy[] }>>(`${environment.apiUrl}/policies`);
  }

  getPolicy(policyId: string) {
    return this.http.get<ApiResponse<{ policy: LeavePolicy }>>(`${environment.apiUrl}/policies/${policyId}`);
  }

  getMyBalance() {
    return this.http.get<ApiResponse<MyBalance>>(`${environment.apiUrl}/policies/my-balance`);
  }

  createPolicy(payload: LeavePolicyPayload) {
    return this.http.post<ApiResponse<{ policy: LeavePolicy }>>(`${environment.apiUrl}/policies`, payload);
  }

  updatePolicy(policyId: string, payload: LeavePolicyPayload) {
    return this.http.patch<ApiResponse<{ policy: LeavePolicy }>>(
      `${environment.apiUrl}/policies/${policyId}`,
      payload,
    );
  }

  deletePolicy(policyId: string) {
    return this.http.delete<ApiResponse<{ policy: LeavePolicy }>>(`${environment.apiUrl}/policies/${policyId}`);
  }
}