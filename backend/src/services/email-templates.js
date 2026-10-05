export function verificationEmailTemplate({ firstName, lastName, verifyUrl }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vérification de votre compte FlowCom</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #f0f0f0;
      color: #2d3748;
      line-height: 1.6;
    }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.1); }
    .header { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 40px 30px; text-align: center; color: #fff; }
    .header h1 { font-size: 28px; font-weight: 600; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: .9; }
    .content { padding: 40px 30px; }
    .welcome { font-size: 18px; text-align: center; margin-bottom: 25px; }
    .box { background: #f8f9fa; border: 2px dashed #e2e8f0; border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; }
    .note { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 15px; margin: 20px 0; text-align: center; font-size: 14px; color: #856404; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin: 40px 0; }
    .feature { text-align: center; padding: 20px; background: #f7fafc; border-radius: 12px; }
    .feature h3 { font-size: 16px; margin-bottom: 8px; }
    .feature p { font-size: 14px; color: #718096; }
    .footer { background: #1a202c; color: #fff; padding: 30px; text-align: center; font-size: 12px; color: #a0aec0; }
    .link { color: #128C7E; word-break: break-all; }
    @media (max-width: 600px) {
      .content, .header { padding: 30px 20px; }
      .features { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vérifiez votre compte</h1>
      <p>Rejoignez la conversation en toute sécurité</p>
    </div>
    <div class="content">
      <p class="welcome">
        Bonjour <strong>${firstName} ${lastName}</strong>,<br />
        Bienvenue sur FlowCom, votre nouvelle application de messagerie.
      </p>
      <div class="box">
        <p>Pour activer votre compte et commencer à discuter :</p>
        <a href="${verifyUrl}" class="btn">Vérifier mon compte</a>
      </div>
      <div class="note">
        <strong>Important :</strong> ce lien expire dans 24 heures.
      </div>
      <div class="features">
        <div class="feature">
          <h3>Messages chiffrés</h3>
          <p>Vos conversations sont sécurisées de bout en bout</p>
        </div>
        <div class="feature">
          <h3>Rapide &amp; fluide</h3>
          <p>Expérience utilisateur optimisée</p>
        </div>
        <div class="feature">
          <h3>Multiplateforme</h3>
          <p>Disponible sur tous vos appareils</p>
        </div>
      </div>
      <p style="text-align:center;color:#718096;font-size:14px;margin-top:30px;">
        Si le bouton ne fonctionne pas, copiez ce lien :<br />
        <span class="link">${verifyUrl}</span>
      </p>
    </div>
    <div class="footer">
      FlowCom &mdash; tous droits réservés.
    </div>
  </div>
</body>
</html>`;
}