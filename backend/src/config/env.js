const REQUIRED_VARS = ['MONGO_URL', 'JWT_SECRET'];

const OPTIONAL_VARS = {
  NODE_ENV: 'development',
  PORT: '3000',
  CLIENT_ORIGIN: 'http://localhost:4200',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  SMTP_USER: '',
  SMTP_PASS: '',
  MAIL_FROM: 'FlowCom <no-reply@flowcom.local>',
  APP_URL: 'http://localhost:3000',
  XAI_API_KEY: '',
  XAI_BASE: 'https://api.groq.com/openai/v1',
};

function load() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes : ${missing.join(', ')}. ` +
        'Copiez backend/.env.example vers backend/.env et renseignez-les.',
    );
  }

  return Object.freeze({
    ...OPTIONAL_VARS,
    ...Object.fromEntries(
      Object.keys({ ...OPTIONAL_VARS, ...process.env }).map((key) => [
        key,
        process.env[key] ?? OPTIONAL_VARS[key],
      ]),
    ),
    MONGO_URL: process.env.MONGO_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    isProduction: process.env.NODE_ENV === 'production',
  });
}

export const env = load();

export const corsOrigins = env.CLIENT_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);