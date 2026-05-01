import { Response } from 'express';

const KEYCLOAK_TOKEN_URL =
  process.env['KEYCLOAK_TOKEN_URL'] ??
  'http://localhost:8080/realms/portfolio/protocol/openid-connect/token';
const CLIENT_ID = process.env['KEYCLOAK_CLIENT_ID'] ?? 'Portfolio';
const IS_PROD = process.env['NODE_ENV'] === 'production';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export const baseCookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'strict' as const,
  path: '/',
};

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface UserInfo {
  name: string;
  username: string;
  email: string;
}

interface JwtPayload {
  name?: string;
  preferred_username?: string;
  email?: string;
  exp?: number;
}

export async function fetchTokensFromKeycloak(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw { status: response.status, error };
  }

  return response.json() as Promise<TokenResponse>;
}

export function setTokenCookies(res: Response, tokens: TokenResponse): void {
  res.cookie(ACCESS_COOKIE, tokens.access_token, {
    ...baseCookieOptions,
    maxAge: tokens.expires_in * 1000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refresh_token, {
    ...baseCookieOptions,
    maxAge: tokens.refresh_expires_in * 1000,
  });
}

export function clearTokenCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions);
}

export function decodeUserInfo(accessToken: string): JwtPayload {
  const payload = accessToken.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
}

export function extractUserInfo(accessToken: string): UserInfo {
  const { name = '', preferred_username: username = '', email = '' } = decodeUserInfo(accessToken);
  return { name, username, email };
}

export function isTokenExpired(accessToken: string): boolean {
  const { exp } = decodeUserInfo(accessToken);
  return !!exp && Date.now() / 1000 > exp;
}

export function buildPasswordGrantBody(username: string, password: string): URLSearchParams {
  return new URLSearchParams({ grant_type: 'password', client_id: CLIENT_ID, username, password });
}

export function buildRefreshGrantBody(refreshToken: string): URLSearchParams {
  return new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: refreshToken });
}
