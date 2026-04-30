import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { Auth } from '../services/auth';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
 const authService = inject(Auth);
  const token = authService.token();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};