import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  const withToken = (token: string) =>
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  const token = authService.getAccessToken();
  const authReq = token ? withToken(token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isKeycloakCall = req.url.includes('/openid-connect/token');
      if (error.status !== 401 || isKeycloakCall || isRefreshing) {
        return throwError(() => error);
      }

      isRefreshing = true;

      return authService.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          const newToken = authService.getAccessToken();
          return next(newToken ? withToken(newToken) : req);
        }),
        catchError(err => {
          isRefreshing = false;
          return throwError(() => err);
        })
      );
    })
  );
};
