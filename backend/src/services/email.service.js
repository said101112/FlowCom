import nodemailer from 'nodemailer';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { verificationEmailTemplate } from './email-templates.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP_USER / SMTP_PASS non configurés : envoi d\'email impossible');
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return transporter;
}

export async function sendVerificationEmail(user) {
  const verifyUrl = `${env.APP_URL}/auth/verify/${user.verifyToken}`;

  const info = await getTransporter().sendMail({
    from: env.MAIL_FROM,
    to: user.email,
    subject: 'Vérification de votre email',
    html: verificationEmailTemplate({
      firstName: user.firstName,
      lastName: user.lastName,
      verifyUrl,
    }),
  });

  logger.info(`Email de vérification envoyé à ${user.email} (${info.messageId})`);
  return info;
}