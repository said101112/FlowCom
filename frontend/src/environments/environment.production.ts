/**
 * Configuration runtime de FlowCom.
 *
 * Les valeurs de `window.__FLOWCOM_CONFIG__` priment sur les défauts : elles
 * sont écrites dans `public/config.js`, réécrit au démarrage du conteneur
 * Docker. Cela rend les URLs d'API et de socket configurables sans rebuild.
 */
const runtime =
  typeof window !== 'undefined' ? (window.__FLOWCOM_CONFIG__ ?? {}) : {};

export const environment = {
  production: true,
  apiUrl: runtime.apiUrl ?? '/auth',
  socketUrl: runtime.socketUrl ?? '',
} as const;
