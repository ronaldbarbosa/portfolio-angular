# Fluxo de Autenticação

## Contexto

A aplicação é **pública** — não existe login de usuário. A autenticação existe para que a aplicação possa consumir a API protegida. Para isso, é usada uma **service account** (`portfolio`) cadastrada no Keycloak, cujas credenciais ficam no arquivo de environment.

> **Analogia .NET:** é equivalente a um `HttpClient` configurado com `ClientCredentials` para consumir uma API interna — a aplicação se autentica, não o usuário.

Em **produção**, a autenticação está **desabilitada** (`requiresAuth: false`) porque a API pública não exige token. O fluxo completo só acontece no ambiente de **desenvolvimento**.

---

## Arquivos envolvidos

```
src/
├── environments/
│   ├── environment.ts                  # Produção: requiresAuth=false, Keycloak vazio
│   └── environment.development.ts      # Dev: requiresAuth=true, URLs + credenciais locais
├── app/
│   ├── app.config.ts                   # Registra o interceptor e o inicializador de auth
│   ├── services/
│   │   └── auth.service.ts             # Autentica no Keycloak, guarda token em memória
│   └── interceptors/
│       └── auth.interceptor.ts         # Injeta o token em toda request; renova se expirar
```

---

## Fluxo 1 — Boot da aplicação

Ao carregar, antes de qualquer componente ser exibido, a aplicação tenta se autenticar.

```
App inicializa
    │
    └─▶ provideAppInitializer executa firstValueFrom(authService.init())
                                    catchError(() => of(null))  ← falha não bloqueia o boot
            │
            └─▶ authService.init()
                    │
                    ├─ requiresAuth === false? → retorna of(void 0) imediatamente (produção)
                    │
                    └─ requiresAuth === true? → fetchToken()
                            │
                            └─▶ POST keycloak/token
                                    grant_type=password
                                    client_id=Portfolio
                                    username=portfolio
                                    password=portfolio_web
                                        │
                                        └─▶ Keycloak retorna { access_token, expires_in }
                                                │
                                                └─▶ Token salvo em memória (variável privada)
                                                    Expiração = Date.now() + expires_in * 1000
```

> **Por que em memória e não em localStorage?** O token pertence à aplicação, não ao usuário. Não há motivo para persistir entre sessões — a cada reload a aplicação se autentica novamente. Memória é mais simples e suficiente.

---

## Fluxo 2 — Requisições à API

Toda chamada HTTP passa pelo `authInterceptor`, que injeta o token automaticamente se existir.

```
Componente chama projectsService.getProjects()
    │
    └─▶ HttpClient emite GET /api/projects
            │
            └─▶ authInterceptor intercepta
                    │
                    ├─ token válido em memória? → clona a request com o header:
                    │                              Authorization: Bearer eyJ...
                    │                              Envia para a API
                    │
                    └─ sem token? → envia a request sem header (comportamento em produção)
                                    API retorna 401 → ver Fluxo 3
```

> **Equivalente .NET:** um `DelegatingHandler` no `HttpClient` que adiciona o header de autorização em toda requisição de saída.

---

## Fluxo 3 — Token expirado (renovação automática)

O `access_token` do Keycloak tem vida curta (padrão: 5 minutos). Quando expira, a API retorna `401`. O interceptor captura esse erro e re-autentica automaticamente, sem que o usuário perceba.

```
API retorna 401
    │
    └─▶ authInterceptor captura o erro
            │
            ├─ status !== 401? → propaga o erro
            │
            ├─ URL contém '/openid-connect/token'? → propaga o erro (evita loop)
            │
            ├─ isRefreshing === true? → propaga o erro (evita chamadas paralelas)
            │
            └─ não → isRefreshing = true
                        │
                        └─▶ authService.refreshToken() → fetchToken()
                                │
                                ├─ sucesso → isRefreshing = false
                                │            atualiza token em memória
                                │            getAccessToken() retorna novo token
                                │            reexecuta a request original com novo token
                                │            chamador não percebe nada
                                │
                                └─ falha → isRefreshing = false
                                           propaga o erro para o componente tratar
```

---

## Configuração por ambiente

As credenciais e URLs ficam nos arquivos de environment, trocados automaticamente pelo Angular CLI no build.

| Variável | Dev (`environment.development.ts`) | Produção (`environment.ts`) |
|---|---|---|
| `requiresAuth` | `true` | `false` |
| `keycloak.tokenUrl` | `http://localhost:8080/realms/portfolio/protocol/openid-connect/token` | `''` (não usado) |
| `keycloak.clientId` | `Portfolio` | `''` (não usado) |
| `keycloak.username` | `portfolio` | `''` (não usado) |
| `keycloak.password` | `portfolio_web` | `''` (não usado) |
| `projectsApiUrl` | `http://localhost:5142` | `https://portfolio-microservices.onrender.com` |

---

## Resumo do ciclo de vida do token

```
Boot
  │
  ├─ produção (requiresAuth=false) → sem autenticação
  │       requests saem sem token, API pública responde normalmente
  │
  └─ dev (requiresAuth=true) → autentica → token em memória (válido por ~5min)
                                    │
                              requests normais → interceptor adiciona token
                                    │
                              token expira → API retorna 401
                                    │
                              interceptor re-autentica → novo token em memória
                                    │
                              request reexecutada automaticamente
```
