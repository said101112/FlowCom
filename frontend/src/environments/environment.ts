/**
 * Configuration par défaut (utilisée si aucun remplacement n'est appliqué).
 * Pour(builder en CI/CD ou Docker), surchargez via `fileReplacements`
 * dans angular.json : `environment.development.ts`.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/auth',
  socketUrl: 'http://localhost:3000',
} as const;