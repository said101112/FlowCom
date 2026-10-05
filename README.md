# FlowCom

Application de messagerie en temps réel : chat privé, liste d'amis, présence en
ligne et suggestions de réponses par IA.

| Composant | Stack | Port local |
| --- | --- | --- |
| `frontend/` | Angular 18 (NgModule, SSR + prerender du login) | 4200 |
| `backend/` | Node 20, Express 5, Socket.IO, Mongoose 8 | 3000 |
| Base de données | MongoDB 7 | 27017 |

## Démarrage rapide

### 1. Backend

```bash
cd backend
cp .env.example .env      # puis renseigner JWT_SECRET au minimum
npm install
npm run dev               # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start                 # http://localhost:4200
```

### 3. Compte administrateur

```bash
cd backend
ADMIN_EMAIL=admin@flowcom.local ADMIN_PASSWORD='un-mot-de-passe-solide' npm run seed:admin
```

## Avec Docker

```bash
cp backend/.env.example backend/.env
# renseigner JWT_SECRET, puis :

docker compose up --build
docker compose run --rm backend npm run seed:admin
```

L'interface est sur <http://localhost:4200>, l'API sur <http://localhost:3000>.

## Variables d'environnement

Le contrat complet est documenté dans [`backend/.env.example`](backend/.env.example).
Deux variables sont **obligatoires** : le backend refuse de démarrer sans elles.

| Variable | Rôle |
| --- | --- |
| `MONGO_URL` | Chaîne de connexion MongoDB (obligatoire) |
| `JWT_SECRET` | Signature des JWT de session (obligatoire) |
| `CLIENT_ORIGIN` | Origines autorisées par CORS, séparées par des virgules |
| `APP_URL` | URL publique du backend, utilisée dans les emails de vérification |
| `SMTP_*` | Envoi des emails de vérification ; si absent, l'inscription fonctionne sans email |
| `XAI_API_KEY` | Suggestions IA ; si absent, des suggestions par défaut sont renvoyées |
| `LOG_LEVEL` | `error`, `warn`, `info` ou `debug` |

Le frontend lit ses URLs depuis `frontend/public/config.js`, réécrit au démarrage
du conteneur à partir de `API_URL` / `SOCKET_URL`. Voir
[`frontend/README.md`](frontend/README.md).

## Scripts

Depuis `backend/` :

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur avec rechargement automatique (`node --watch`) |
| `npm start` | Serveur de production |
| `npm run check` | Vérification syntaxique de l'entrée et de l'app |
| `npm run seed:admin` | Crée ou met à jour le compte administrateur |
| `npm audit` | Audit de dépendances (actuellement 0 vulnérabilité) |

Depuis `frontend/` :

| Commande | Effet |
| --- | --- |
| `npm start` | Serveur de développement |
| `npm run build` | Build de production dans `dist/flowcom` |
| `npm test` | Tests unitaires Karma/Jasmine |
| `npm run serve:ssr` | Sert le build SSR |

Depuis la racine :

| Commande | Effet |
| --- | --- |
| `python scripts/validate-manifests.py` | Valide les YAML de `k8s/` et de la CI |
| `node scripts/check-env-example.mjs` | Vérifie que `.env.example` couvre tout le code |
| `kubectl kustomize k8s/base` | Construit les manifests Kubernetes |

## Structure du dépôt

```
.
├── backend/                 API REST + Socket.IO
│   ├── src/
│   │   ├── app.js           Configuration Express (sans listen)
│   │   ├── server.js        Point d'entrée : DB + HTTP + Socket.IO
│   │   ├── config/          env.js (validation) et db.js (Mongoose)
│   │   ├── controllers/     Un fichier par domaine
│   │   ├── services/        IA, email, codes ConnectCode
│   │   ├── models/          Schémas Mongoose
│   │   ├── routes/          Routage et application des middlewares
│   │   ├── middleware/      Auth (JWT) et gestion d'erreurs
│   │   ├── realtime/        Passerelle Socket.IO et handlers
│   │   └── utils/           Logger
│   ├── scripts/seed-admin.js
│   └── .env.example
├── frontend/                Angular
│   ├── src/app/core/        Services, intercepteurs, utils (singleton)
│   ├── src/app/components/  Composants de feature
│   ├── src/app/shared/      Composants transverses (loader, toast)
│   ├── src/environments/    Configuration dev / prod
│   └── public/config.js     Configuration runtime
├── k8s/base/                Manifests Kubernetes (kustomize)
├── scripts/                 Validation hors-ligne
└── docker-compose.yml
```

## Documentation

- [`backend/README.md`](backend/README.md) — API, authentification, temps réel
- [`frontend/README.md`](frontend/README.md) — configuration, environnements
- [`k8s/README.md`](k8s/README.md) — déploiement Kubernetes

## Sécurité

- Mots de passe hashés avec bcrypt, jamais renvoyés par l'API.
- Session par JWT dans un cookie `httpOnly`, `sameSite=strict`, `secure` en production.
- Identité de l'utilisateur toujours dérivée du JWT, jamais du corps de requête.
- Champs sensibles (`password`, `verifyToken`) exclus par défaut des projections.
- Token de vérification email à durée de vie de 24 h.

> **À faire avant une mise en production :** les secrets `JWT_SECRET`,
> `XAI_API_KEY` et `SMTP_PASS` ont été committés dans l'historique Git. Ils
> doivent être renouvelés, et l'historique nettoyé. Voir la section
> « Rotation des secrets » du `backend/README.md`.
