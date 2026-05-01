import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../services/auth';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const role = authService.currentUser()?.role;
    return router.createUrlTree([role === 'admin' ? '/admin' : '/dashboard']);
  }

    return true;
};