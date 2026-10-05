/**
 * Vérifie que backend/.env.example reste un contrat complet pour le backend.
 *
 * Lancé par la CI : empêche qu'une variable obligatoire soit supprimée du
 * template et casse le démarrage d'un environnement neuf.
 *
 * Usage : node scripts/check-env-example.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_EXAMPLE = join(ROOT, 'backend', '.env.example');

/** Variables sans valeur par défaut : le serveur refuse de démarrer sans. */
const REQUIRED = ['MONGO_URL', 'JWT_SECRET'];

/** Variables utilisées par le code, avec valeur par défaut tolérée. */
const REFERENCED = [
  ...REQUIRED,
  'NODE_ENV',
  'PORT',
  'CLIENT_ORIGIN',
  'APP_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
  'XAI_API_KEY',
  'XAI_BASE',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_USERNAME',
  'ADMIN_PHONE',
  'LOG_LEVEL',
];

let content;

try {
  content = readFileSync(ENV_EXAMPLE, 'utf8');
} catch {
  console.error(`${ENV_EXAMPLE} introuvable.`);
  process.exit(1);
}

const declared = new Set(
  content
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=/)?.[1])
    .filter(Boolean),
);

const problems = [
  ...REQUIRED.filter((key) => !declared.has(key)).map(
    (key) => `variable obligatoire absente de .env.example : ${key}`,
  ),
  ...[...declared]
    .filter((key) => !REFERENCED.includes(key))
    .map((key) => `variable inconnue (non lue par le code) : ${key}`),
  ...REFERENCED.filter((key) => !declared.has(key)).map(
    (key) => `variable utilisée par le code mais absente du template : ${key}`,
  ),
];

if (problems.length > 0) {
  console.error(`${ENV_EXAMPLE} incohérent :`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`.env.example OK (${declared.size} variables).`);
