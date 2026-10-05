# Déploiement Kubernetes

Manifests dans `base/`, construits avec [kustomize](https://kubectl.docs.kubernetes.io/installation/kustomize/).

| Fichier | Ressources |
| --- | --- |
| `mongo.yaml` | Service + StatefulSet MongoDB 7 avec volume persistant |
| `backend.yaml` | ConfigMap, Secret, Deployment (2 réplicas), Service, PodDisruptionBudget |
| `frontend.yaml` | ConfigMap, Deployment (2 réplicas), Service |
| `ingress.yaml` | Ingress unique : `/auth` et `/socket.io` vers le backend, le reste vers le frontend |
| `kustomization.yaml` | Namespace `flowcom` et assemblage |

## Valider sans cluster

```bash
python scripts/validate-manifests.py   # syntaxe YAML, apiVersion/kind, références
kubectl kustomize k8s/base             # construit l'overlay localement
```

## Secrets

`base/backend.yaml` déclare un Secret **vide**, servant uniquement de gabarit.
Ne commitez jamais de valeurs réelles. Créez le secret en ligne :

```bash
kubectl create namespace flowcom

kubectl -n flowcom create secret generic flowcom-backend-secrets \
  --from-literal=JWT_SECRET="$(node -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))')" \
  --from-literal=XAI_API_KEY="" \
  --from-literal=SMTP_USER="" \
  --from-literal=SMTP_PASS="" \
  --from-literal=ADMIN_EMAIL="" \
  --from-literal=ADMIN_PASSWORD=""
```

En production, préférez [External Secrets Operator](https://external-secrets.io/)
ou le SecretManager de votre fournisseur cloud plutôt qu'un Secret en clair.

## Adapter à votre cluster

1. **Images** — remplacez `flowcom-backend:latest` et `flowcom-frontend:latest`
   par vos images. Si elles sont privées, ajoutez un `imagePullSecrets`.
2. **Hôte** — dans `ingress.yaml`, remplacez `flowcom.local` par votre domaine,
   puis `CLIENT_ORIGIN`, `APP_URL` dans `backend.yaml` et `API_URL`,
   `SOCKET_URL` dans `frontend.yaml`.
3. **Contrôleur d ingress** — `ingressClassName: nginx` suppose l'ingress-nginx.
   Si votre cluster n'en a pas, retirez `ingress.yaml` et utilisez
   `kubectl port-forward`.
4. **WebSockets** — l'ingress nginx nécessite des timeouts allongés ; ils sont
   déjà positionnés via les annotations `proxy-read-timeout` /
   `proxy-send-timeout`.
5. **MongoDB** — le StatefulSet convient au développement. En production, utilisez
   Atlas ou un operator avec sauvegardes.

## Déployer

```bash
kubectl apply -k k8s/base
kubectl -n flowcom rollout status deployment/flowcom-backend
kubectl -n flowcom rollout status deployment/flowcom-frontend
```

Créer le compte administrateur :

```bash
kubectl -n flowcom exec deploy/flowcom-backend -- \
  env ADMIN_EMAIL=admin@flowcom.local ADMIN_PASSWORD='...' npm run seed:admin
```

## Accès rapide

```bash
kubectl -n flowcom port-forward svc/flowcom-frontend 4200:4000
kubectl -n flowcom port-forward svc/flowcom-backend 3000:3000
```

## Diagnostics

```bash
kubectl -n flowcom get pods
kubectl -n flowcom describe pod -l component=backend
kubectl -n flowcom logs -l component=backend -f
kubectl -n flowcom logs -l component=frontend -f
```

Le backend expose `GET /health`, utilisé par les probes de liveness et de
readiness. Si le backend reste `CrashLoopBackOff`, la cause la plus fréquente est
une variable obligatoire absente : vérifiez la ConfigMap, le Secret et les logs.
