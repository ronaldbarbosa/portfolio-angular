# Fluxo de Autenticação

## Visão Geral

A autenticação usa o padrão **BFF (Backend for Frontend)**. Em vez do Angular chamar o Keycloak diretamente, ele chama o servidor Express que acompanha a aplicação — e é esse servidor que conversa com o Keycloak e devolve os tokens em cookies HTTP-only.

> **Analogia .NET:** pense no servidor Express como um Controller de uma API que faz proxy da autenticação. O Angular seria o cliente (Razor Pages, Blazor ou um SPA qualquer) que nunca vê o token diretamente.

---

## Por que HTTP-only cookies?

Tokens guardados em `localStorage` são acessíveis via JavaScript — qualquer script malicioso (XSS) pode roubá-los. Cookies HTTP-only **não podem ser lidos por JavaScript**: o navegador os envia automaticamente nas requisições, mas nenhum código no browser consegue acessar seu valor.

| | localStorage | Cookie HTTP-only |
|---|---|---|
| Leitura via JS | Sim | Não |
| Envio automático | Não (manual) | Sim |
| Vulnerável a XSS | Sim | Não |

---

## Arquivos envolvidos

```
src/
├── server/
│   ├── auth.service.ts       # Lógica: chama Keycloak, manipula cookies, decodifica JWT
│   └── auth.routes.ts        # Rotas Express: /api/auth/login|refresh|me|logout
├── server.ts                 # Servidor Express principal (monta as rotas)
├── environments/
│   ├── environment.ts        # Produção
│   └── environment.development.ts  # Desenvolvimento (localhost:4000)
└── app/
    ├── services/
    │   └── auth.service.ts   # Service Angular: chama o BFF, gerencia estado do usuário
    ├── interceptors/
    │   └── auth.interceptor.ts  # Interceptor: trata 401 fazendo refresh automático
    └── app.config.ts         # Registra o interceptor e o APP_INITIALIZER
```

---

## Fluxo 1 — Boot da aplicação

Ao carregar a aplicação, o Angular tenta restaurar uma sessão existente.

```
Angular inicia
    │
    └─▶ APP_INITIALIZER executa auth.init()
            │
            └─▶ GET /api/auth/me  (envia cookie automaticamente)
                    │
                    ├─ cookie válido  → Express decodifica o JWT, retorna { name, email }
                    │                   Angular salva o usuário no BehaviorSubject
                    │
                    └─ sem cookie / expirado → 401 (silenciado)
                                               Usuário permanece como não autenticado
```

> **Equivalente .NET:** `IHostedService` ou middleware que valida o cookie de sessão na primeira requisição.

---

## Fluxo 2 — Login

```
Usuário preenche username e senha
    │
    └─▶ AuthService.login(username, password)
            │
            └─▶ POST /api/auth/login  { username, password }
                    │
                    └─▶ Express monta o body URL-encoded e chama o Keycloak:
                        POST keycloak/token  grant_type=password
                            │
                            └─▶ Keycloak retorna access_token + refresh_token
                                    │
                                    └─▶ Express grava os cookies HTTP-only:
                                        Set-Cookie: access_token=...  (HttpOnly, expira em 5min)
                                        Set-Cookie: refresh_token=... (HttpOnly, expira em 30min)
                                            │
                                            └─▶ Retorna ao Angular: { name, username, email }
                                                    │
                                                    └─▶ Angular salva no BehaviorSubject
                                                        (a view reage automaticamente)
```

> **Nota:** O Angular nunca vê o valor do token. Só recebe os dados do usuário para exibição.

---

## Fluxo 3 — Requisições autenticadas

Após o login, o navegador envia os cookies automaticamente em toda requisição para o mesmo domínio. Nenhuma configuração extra é necessária no Angular além do `withCredentials: true`.

```
Angular faz GET /api/alguma-coisa
    │
    └─▶ Navegador anexa automaticamente:
        Cookie: access_token=eyJ...
            │
            └─▶ Servidor/API valida o token e responde
```

---

## Fluxo 4 — Token expirado (refresh automático)

O `access_token` dura apenas 5 minutos. Quando expira, o servidor retorna `401`. O interceptor Angular captura esse erro e faz o refresh de forma transparente.

```
Requisição qualquer retorna 401
    │
    └─▶ authInterceptor intercepta o erro
            │
            ├─ é um endpoint /api/auth/ ? → sim → propaga o erro (evita loop infinito)
            │
            ├─ já está fazendo refresh?  → sim → propaga o erro (evita chamadas duplicadas)
            │
            └─ não → POST /api/auth/refresh  (envia o cookie refresh_token)
                        │
                        ├─ sucesso → Express grava cookies novos
                        │           Interceptor reexecuta a requisição original
                        │           Usuário não percebe nada
                        │
                        └─ falha  → AuthService.logout() limpa os cookies
                                    Usuário precisa logar novamente
```

> **Equivalente .NET:** um `DelegatingHandler` no `HttpClient` que refaz a requisição após renovar o token.

---

## Fluxo 5 — Logout

```
Usuário clica em "Sair"
    │
    └─▶ AuthService.logout()
            │
            └─▶ POST /api/auth/logout
                    │
                    └─▶ Express apaga os cookies:
                        Set-Cookie: access_token=; Max-Age=0
                        Set-Cookie: refresh_token=; Max-Age=0
                            │
                            └─▶ Angular limpa o BehaviorSubject (usuário = null)
                                A view reage e redireciona para login
```

---

## Estado de autenticação no Angular

O `AuthService` expõe um `BehaviorSubject<UserInfo | null>` chamado `user$`. Qualquer componente pode se inscrever para reagir a mudanças:

```typescript
// Em qualquer componente
readonly user = toSignal(this.authService.currentUser$);

// No template
@if (user()) {
  <span>Olá, {{ user()!.name }}</span>
} @else {
  <a routerLink="/login">Entrar</a>
}
```

> **Equivalente .NET:** similar ao `ClaimsPrincipal` disponível via `HttpContext.User`, mas reativo — a view atualiza automaticamente sem precisar de reload.

---

## Variáveis de ambiente (servidor)

O servidor Express lê as configurações do Keycloak via variáveis de ambiente:

| Variável | Padrão | Descrição |
|---|---|---|
| `KEYCLOAK_TOKEN_URL` | `http://localhost:8080/realms/portfolio/...` | URL do endpoint de token |
| `KEYCLOAK_CLIENT_ID` | `Portfolio` | Client ID cadastrado no Keycloak |
| `NODE_ENV` | — | Se `production`, ativa o flag `Secure` nos cookies |
