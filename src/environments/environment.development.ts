export const environment = {
  production: false,
  requiresAuth: true,
  keycloak: {
    tokenUrl: 'http://localhost:8080/realms/portfolio/protocol/openid-connect/token',
    clientId: 'Portfolio',
    username: 'portfolio',
    password: 'portfolio_web',
  },
  projectsApiUrl: 'http://localhost:5142',
};
