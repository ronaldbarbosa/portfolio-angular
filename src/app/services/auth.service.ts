import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserInfo {
  name: string;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api/auth`;

  private user$ = new BehaviorSubject<UserInfo | null>(null);

  get currentUser$(): Observable<UserInfo | null> {
    return this.user$.asObservable();
  }

  get isAuthenticated(): boolean {
    return this.user$.value !== null;
  }

  init(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.base}/me`, { withCredentials: true }).pipe(
      tap(user => this.user$.next(user)),
      catchError(err => {
        this.user$.next(null);
        return throwError(() => err);
      })
    );
  }

  login(username: string, password: string): Observable<UserInfo> {
    return this.http
      .post<UserInfo>(`${this.base}/login`, { username, password }, { withCredentials: true })
      .pipe(tap(user => this.user$.next(user)));
  }

  refreshToken(): Observable<UserInfo> {
    return this.http
      .post<UserInfo>(`${this.base}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap(user => this.user$.next(user)),
        catchError(err => {
          this.user$.next(null);
          return throwError(() => err);
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.user$.next(null)));
  }
}
