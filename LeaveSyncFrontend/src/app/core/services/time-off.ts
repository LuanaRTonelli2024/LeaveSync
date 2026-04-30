import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { TimeOffRequest } from '../models/time-off-request';

interface ApiResponse<T> {
  data: T;
}


interface TimeOffPayload {
  type?: 'vacation' | 'sick';
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  status?: 'pending' | 'approved' | 'denied';
}


@Injectable({
  providedIn: 'root',
})
export class TimeOff {
  private readonly http = inject(HttpClient);

  getRequests() {
    return this.http.get<ApiResponse<{ requests: TimeOffRequest[] }>>(`${environment.apiUrl}/requests`);
  }

  getMyRequests() {
    return this.http.get<ApiResponse<{ requests: TimeOffRequest[] }>>(`${environment.apiUrl}/requests/me`);
  }

  createRequest(payload: TimeOffPayload) {
    return this.http.post<ApiResponse<{ request: TimeOffRequest }>>(`${environment.apiUrl}/requests`, payload);
  }

  updateRequest(requestId: string, payload: TimeOffPayload) {
    return this.http.patch<ApiResponse<{ request: TimeOffRequest }>>(
      `${environment.apiUrl}/requests/${requestId}`,
      payload,
    );
  }

  deleteRequest(requestId: string) {
    return this.http.delete<ApiResponse<{ request: TimeOffRequest }>>(`${environment.apiUrl}/requests/${requestId}`);
  }

  approveRequest(requestId: string) {
    return this.http.patch<ApiResponse<{ request: TimeOffRequest }>>(
      `${environment.apiUrl}/requests/${requestId}/approve`, {}
    );
  }

  denyRequest(requestId: string) {
    return this.http.patch<ApiResponse<{ request: TimeOffRequest }>>(
      `${environment.apiUrl}/requests/${requestId}/deny`, {}
    );
  }
}
