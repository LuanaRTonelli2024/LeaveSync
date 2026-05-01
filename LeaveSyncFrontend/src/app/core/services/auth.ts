import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { User } from '../models/user';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'admin';
  department?: string;
  hireDate: string;
}

interface AuthData {
  token: string;
  user: User;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'leavesync_session';
  private readonly session = signal<{ token: string; user: User } | null>(this.restoreSession());

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.token()));

  login(payload: LoginPayload): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<AuthData>>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.setSession(response.data)));
  }

  register(payload: RegisterPayload): Observable<ApiResponse<{ user: User }>> {
    return this.http.post<ApiResponse<{ user: User }>>(
      `${environment.apiUrl}/auth/register`,
      payload,
    );
  }

  fetchMe(): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((response) => this.patchUser(response.data.user)));
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(this.storageKey);
  }

  private setSession(data: AuthData): void {
    this.session.set(data);
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private patchUser(user: User): void {
    const currentSession = this.session();
    if (!currentSession) return;
    this.setSession({ token: currentSession.token, user });
  }

  private restoreSession(): { token: string; user: User } | null {
    const rawSession = localStorage.getItem(this.storageKey);
    if (!rawSession) return null;
    try {
      return JSON.parse(rawSession) as { token: string; user: User };
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}