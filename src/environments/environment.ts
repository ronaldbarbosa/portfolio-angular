export const environment = {
  production: true,
  keycloak: {
    tokenUrl: 'https://YOUR_PRODUCTION_KEYCLOAK/realms/portfolio/protocol/openid-connect/token',
    clientId: 'Portfolio',
    username: 'portfolio',
    password: 'portfolio_web',
  },
  projectsApiUrl: 'https://YOUR_PRODUCTION_API',
};
