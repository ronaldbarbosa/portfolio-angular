import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  init(): Observable<void> {
    if (!environment.requiresAuth) return of(void 0);
    return this.fetchToken();
  }

  getAccessToken(): string | null {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    return null;
  }

  refreshToken(): Observable<void> {
    return this.fetchToken();
  }

  private fetchToken(): Observable<void> {
    const { tokenUrl, clientId, username, password } = environment.keycloak;

    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', clientId)
      .set('username', username)
      .set('password', password);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post<TokenResponse>(tokenUrl, body.toString(), { headers }).pipe(
      tap(({ access_token, expires_in }) => {
        this.accessToken = access_token;
        this.tokenExpiry = Date.now() + expires_in * 1000;
      }),
      map(() => void 0)
    );
  }
}
