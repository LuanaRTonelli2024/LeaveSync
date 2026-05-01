import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { EmployeeDashboard} from './features/dashboard/employee-dashboard/employee-dashboard';
import { AdminDashboard } from './features/dashboard/admin-dashboard/admin-dashboard';
import { RequestTimeOff } from './features/time-off/request-time-off/request-time-off';

 
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'dashboard', component: EmployeeDashboard, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboard, canActivate: [authGuard] },
  { path: 'request-time-off', component: RequestTimeOff, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];