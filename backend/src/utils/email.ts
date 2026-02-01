import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!transporter || !env.EMAIL_FROM) {
    console.warn('Email not configured, skipping send to:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    return false;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          margin: 0 auto 16px;
        }
        h1 {
          color: #667eea;
          margin: 0;
        }
        .content {
          background: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
          margin: 16px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .link {
          word-break: break-all;
          color: #667eea;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo"></div>
        <h1>Respire</h1>
      </div>
      <div class="content">
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p class="link">${resetUrl}</p>
        <p><strong>Ce lien expire dans 1 heure.</strong></p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
      </div>
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par Respire.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, 'Réinitialisation de votre mot de passe - Respire', html);
}

export async function sendPasswordResetConfirmationEmail(
  to: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #667eea;
          margin: 0;
        }
        .content {
          background: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .footer {
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Respire</h1>
      </div>
      <div class="content">
        <p>Bonjour,</p>
        <p>Votre mot de passe a été modifié avec succès.</p>
        <p>Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.</p>
      </div>
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par Respire.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, 'Votre mot de passe a été modifié - Respire', html);
}

export async function sendAdminPasswordResetEmail(
  to: string,
  temporaryPassword: string
): Promise<boolean> {
  const loginUrl = `${env.FRONTEND_URL}/auth/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #667eea;
          margin: 0;
        }
        .content {
          background: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .password-box {
          background: #fff;
          border: 2px dashed #667eea;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          margin: 16px 0;
        }
        .password {
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 600;
        }
        .footer {
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Respire</h1>
      </div>
      <div class="content">
        <p>Bonjour,</p>
        <p>Un administrateur a réinitialisé votre mot de passe.</p>
        <p>Voici votre nouveau mot de passe temporaire :</p>
        <div class="password-box">
          <span class="password">${temporaryPassword}</span>
        </div>
        <p><strong>Nous vous recommandons de changer ce mot de passe après votre connexion.</strong></p>
        <p style="text-align: center;">
          <a href="${loginUrl}" class="button">Se connecter</a>
        </p>
      </div>
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par Respire.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, 'Votre mot de passe a été réinitialisé - Respire', html);
}
