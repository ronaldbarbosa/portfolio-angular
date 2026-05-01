import { Router, Request, Response } from 'express';
import {
  fetchTokensFromKeycloak,
  setTokenCookies,
  clearTokenCookies,
  extractUserInfo,
  isTokenExpired,
  buildPasswordGrantBody,
  buildRefreshGrantBody,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from './auth.service';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'username e password são obrigatórios' });
    return;
  }

  try {
    const tokens = await fetchTokensFromKeycloak(buildPasswordGrantBody(username, password));
    setTokenCookies(res, tokens);
    res.json(extractUserInfo(tokens.access_token));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: 'Falha na autenticação', detail: err.error });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];

  if (!refreshToken) {
    res.status(401).json({ message: 'Sessão expirada' });
    return;
  }

  try {
    const tokens = await fetchTokensFromKeycloak(buildRefreshGrantBody(refreshToken));
    setTokenCookies(res, tokens);
    res.json(extractUserInfo(tokens.access_token));
  } catch (err: any) {
    clearTokenCookies(res);
    res.status(err.status ?? 500).json({ message: 'Sessão inválida', detail: err.error });
  }
});

router.get('/me', (req: Request, res: Response) => {
  const accessToken = req.cookies?.[ACCESS_COOKIE];

  if (!accessToken || isTokenExpired(accessToken)) {
    res.status(401).json({ message: 'Não autenticado' });
    return;
  }

  try {
    res.json(extractUserInfo(accessToken));
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  clearTokenCookies(res);
  res.json({ message: 'Logout realizado com sucesso' });
});

export default router;
