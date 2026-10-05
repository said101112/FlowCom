# FlowCom — Backend

API REST et passerelle Socket.IO de FlowCom. Node 20, Express 5, Mongoose 8.

## Démarrage

```bash
cp .env.example .env
npm install
npm run dev
```

Le serveur écoute sur `http://localhost:3000` et expose `GET /health`.

`MONGO_URL` et `JWT_SECRET` sont obligatoires : sans elles, le processus
s'arrête avec un message explicite plutôt que d'échouer plus tard.

## Organisation

```
src/
├── server.js          Point d'entrée : connexion DB, serveur HTTP, Socket.IO, arrêt propre
├── app.js             Application Express (sans listen) et middlewares globaux
├── config/
│   ├── env.js         Lecture et validation des variables d'environnement
│   └── db.js          Connexion Mongoose + arrêt
├── routes/index.js    Table de routage et application des middlewares
├── controllers/       Logique HTTP, un fichier par domaine
│   ├── auth.controller.js
│   ├── friend.controller.js
│   ├── message.controller.js
│   └── user.controller.js
├── services/          Logique transverse
│   ├── ai.service.js
│   ├── email.service.js
│   ├── email-templates.js
│   └── connect-code.service.js
├── models/            Schémas Mongoose
├── middleware/        protect (JWT), requireRole, errorHandler
├── realtime/          Passerelle Socket.IO
│   ├── gateway.js
│   ├── presence.js
│   └── handlers/      message.handler.js, friend.handler.js
└── utils/logger.js
```

### Pourquoi `presence.js` existe

Le serveur exportait autrefois `io` et `onlineUser` depuis `index.js`. Les
contrôleurs les importaient pour émettre un message, ce qui créait un cycle
`server.js → routes → controllers → server.js` : l'ordre d'initialisation des
modules ESM rendait ce comportement imprévisible.

`presence.js` est désormais un registre neutre, rempli par `gateway.js` au
démarrage. Les contrôleurs importent `presence`, jamais le serveur.

## API

Toutes les routes sont préfixées par `/auth`. Les routes marquées 🔒 exigent un
cookie `auth_token` valide.

### Authentification

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/signup` | — | Crée un compte et envoie l'email de vérification |
| POST | `/auth/signin` | — | Pose le cookie de session |
| GET | `/auth/verify/:token` | — | Valide le token email (24 h) |
| POST | `/auth/logout` | 🔒 | Supprime le cookie de session |
| POST | `/auth/updateLastLogin` | 🔒 | Met à jour `lastSeen` |

### Amis

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/addAmis` | 🔒 | Ajout par email ou username, réciproque |
| GET | `/auth/getAmis/:userId` | 🔒 | Amis + non-lus + dernier message (uniquement le sien) |

### Messages

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/sendMessage/:receverId` | 🔒 | Envoie un message et notifie le destinataire |
| GET | `/auth/getAllmsgs/:selectuserId` | 🔒 | Historique, puis marque les messages reçus comme vus |

### Utilisateurs

| Méthode | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/auth/user/:id` | 🔒 | Profil public |
| GET | `/auth/getAllusers` | 🔒 admin | Tous les utilisateurs |

### Exemple

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"motdepasse"}' \
  -c cookies.txt

curl http://localhost:3000/auth/getAmis/<userId> -b cookies.txt
```

## Temps réel (Socket.IO)

L'authentification passe par le cookie `auth_token` envoyé au handshake. Un
handshake sans JWT valide est immédiatement déconnecté.

**Côté client → serveur**

| Événement | Payload | Effet |
| --- | --- | --- |
| `joinRoom` | `room: string` | Rejoint une room |
| `sendMessage` | `{ Room, message }` | Alimente le contexte IA du salon |
| `AddFriend` | `{ CodeConnectF }` | Ajout d'ami par code |

**Côté serveur → client**

| Événement | Payload |
| --- | --- |
| `getOnlineUsers` | `string[]` — identifiants connectés |
| `newMessage` | Message + `senderUsername` |
| `ai_segg` | `{ s: string[] }` — 3 suggestions |
| `newFriend` | `{ from, username }` |
| `friendAdded` | `{ friendId, username }` |
| `AddFriendError` | `{ message }` |

Le contexte IA est un tampon mémoire de 8 messages par salon, volontairement non
persistant.

## Compte administrateur

```bash
ADMIN_EMAIL=admin@flowcom.local \
ADMIN_PASSWORD='mot-de-passe-solide' \
ADMIN_USERNAME=admin \
npm run seed:admin
```

Les identifiants viennent de l'environnement, jamais du code. Le script crée le
compte ou réinitialise son mot de passe et son rôle.

## Rotation des secrets

Des secrets ont été committés dans l'historique Git. Avant toute mise en
production :

1. **Renouveler** `JWT_SECRET` — invalide toutes les sessions :
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
   Renouveler également `XAI_API_KEY` et `SMTP_PASS` auprès de leurs fournisseurs.

2. **Nettoyer l'historique** avec [git-filter-repo](https://github.com/newren/git-filter-repo)
   :
   ```bash
   git filter-repo --path backend/.env --path back/backend/.env --invert-paths
   ```
   puis forcer la réécriture des branches distantes. À coordonner avec toute
   l'équipe : cela change toutes les empreintes de commit.

## Notes

- `npm audit` ne remonte aucune vulnérabilité. `nodemon` a été remplacé par
  `node --watch` (intégré à Node 20), ce qui élimine la chaîne
  `chokidar`/`braces` vulnérable et une dépendance de développement.
- Les projections de modèles excluent `password`, `verifyToken` et
  `verifyTokenExpiresAt` par défaut.
- `getAmis` utilise deux agrégations MongoDB plutôt qu'une requête par ami.
