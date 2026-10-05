# FlowCom — Frontend

Interface Angular 18 de FlowCom. Application NgModule avec SSR.

## Démarrage

```bash
npm install
npm start          # http://localhost:4200
```

Le serveur de développement attend l'API sur `http://localhost:3000` (voir
`src/environments/environment.development.ts`). Configurez `CLIENT_ORIGIN`
côté backend pour que le CORS corresponde.

## Build

```bash
npm run build      # dist/flowcom
npm run serve:ssr  # sert le build sur http://localhost:4000
```

Le build :

1. compile le bundle navigateur dans `dist/flowcom/browser` ;
2. compile le serveur SSR dans `dist/flowcom/server` ;
3. pré-rendue uniquement `/` (voir `routes.txt`).

## Configuration : deux niveaux

### 1. Au build — `src/environments/`

| Fichier | Usage |
| --- | --- |
| `environment.development.ts` | `ng serve`, `ng build --configuration development` |
| `environment.production.ts` | `ng build` (par défaut) |

Le remplacement de fichier est déclaré dans `angular.json` via `fileReplacements`.

### 2. Au démarrage — `public/config.js`

En production, les valeurs de `environment.production.ts` sont lues depuis
`window.__FLOWCOM_CONFIG__`, écrit par `public/config.js`. Ce fichier est
réécrit au démarrage du conteneur :

```yaml
environment:
  API_URL: https://api.flowcom.com/auth
  SOCKET_URL: https://api.flowcom.com
```

`docker-entrypoint.sh` génère alors `dist/flowcom/browser/config.js`. Conséquence
pratique : **changer d'URL ne nécessite pas de reconstruire l'image Angular**,
seulement de redémarrer le conteneur.

Si la variable est vide, l'application utilise l'origine courante — pratique
quand un reverse proxy sert le frontend et l'API sur le même hôte.

## Organisation

```
src/
├── app/
│   ├── core/                Racine de l'application : une seule instance
│   │   ├── services/        ApiService, SocketService, LoadingService
│   │   ├── interceptors/    Loading global, withCredentials, erreurs HTTP
│   │   └── utils/           storage.util (accès sûr au localStorage)
│   ├── components/          Composants de feature
│   │   ├── chat/            Fil de discussion, sidebar, liste de conversations
│   │   ├── login/           Connexion et inscription
│   │   ├── error/           Page d'erreur HTTP
│   │   └── border-anim/     Animation de bordure
│   └── shared/              Composants transverses
│       ├── loader/          Spinner global
│       └── toast/           Notifications
├── environments/
├── types/
└── public/
    └── config.js            Configuration runtime
```

`core/` ne dépend d'aucun composant, et aucun composant ne déclare de service :
tout passe par des services `providedIn: 'root'` dans `core/`.

## Rendu serveur et pré-rendu

Seule la page de connexion est pré-rendue. Les pages authentifiées (`/chat`)
dépendent d'un cookie de session et de WebSockets, donc elles sont rendues côté
client uniquement. Pour cette raison :

- `chat.component.ts` et `sidebar.component.ts` n'appellent pas `localStorage`
  ni n'ouvrent de socket sur le serveur (`isPlatformBrowser`) ;
- tous les accès au stockage passent par `core/utils/storage.util.ts`, qui
  renvoie `null` hors navigateur.

Pour ajouter une page pré-rendue, ajoutez sa route dans `routes.txt` (une route
par ligne, sans commentaires).

## Intercepteur HTTP

`HttpInterceptorService` :

- ajoute `withCredentials` à toutes les requêtes ;
- affiche le loader global, sauf sur une liste de routes « silencieuses »
  (`sendMessage`, `getAmis`, `getAllmsgs`) pour éviter le clignotement pendant
  l'usage ;
- redirige vers `/login` sur un 401 et vers `/error/:code` sur 403/404/500.

## Tests

```bash
npm test                        # mode watch
npx ng test --watch=false       # une passe
```

`core/interceptors/http.interceptor.spec.ts` couvre les trois comportements de
l'intercepteur.

## Notes

- Le projet Angular s'appelle `flowcom` (et non plus `chatv2`) : le nom est
  cohérent dans `angular.json`, `package.json`, `outputPath` et le serveur SSR.
- Le service `crypto.service.ts` a été supprimé : il importait `tweetnacl` et
  `localforage`, qui n'étaient pas déclarés dans `package.json`. Aucun
  composant ne l'utilisait, et il empêchait `ng test` de compiler.
- Les avertissements CommonJS (`debug`, `xmlhttprequest-ssl`) sont déclarés dans
  `allowedCommonJsDependencies`.
