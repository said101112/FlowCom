/**
 * Configuration runtime de FlowCom.
 *
 * Ce fichier est statique et servi tel quel par le navigateur. En Docker, il
 * est réécrit au démarrage du conteneur à partir des variables d'environnement
 * (voir docker-entrypoint.sh), ce qui permet de changer les URLs d'API et de
 * socket sans reconstruire l'image Angular.
 */
window.__FLOWCOM_CONFIG__ = {
  apiUrl: '/auth',
  socketUrl: '',
};
