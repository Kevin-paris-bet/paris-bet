const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = 'contact@payperwin.co';
const FROM_NAME  = 'PayPerWin';

async function sendEmail({ to, toName, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to, name: toName || '' }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur Brevo');
  }
  return res.json();
}

// ── Templates emails ───────────────────────────────────────────

function templateBienvenue({ prenom, role }) {
  const isUser = role === 'user';
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <!-- Header -->
        <tr><td style="background:#1a56ff;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px">PayPerWin</p>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7)">La plateforme des tipsters sérieux</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a">Bienvenue, ${prenom} ! 🎉</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6">
            ${isUser
              ? `Votre compte <strong>parieur</strong> PayPerWin est prêt. Vous pouvez maintenant recharger votre solde et acheter des pronostics de nos tipsters vérifiés.`
              : `Votre compte <strong>tipster</strong> PayPerWin est prêt. Publiez vos premiers pronostics et commencez à générer des revenus — vous n'êtes payé que quand vous gagnez.`
            }
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
            ${isUser
              ? `Le principe est simple : vous achetez un prono, et si le tipster perd, vous êtes <strong>remboursé automatiquement</strong>. Aucun risque inutile.`
              : `Votre page publique est accessible dès maintenant. Ajoutez votre RIB pour recevoir vos virements chaque lundi.`
            }
          </p>
          <a href="https://payperwin.co" style="display:inline-block;background:#1a56ff;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
            Accéder à mon espace →
          </a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5">
            PayPerWin · contact@payperwin.co · <a href="https://payperwin.co" style="color:#94a3b8">payperwin.co</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function templateDepot({ prenom, amount }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#1a56ff;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:800;color:white">PayPerWin</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a">Dépôt confirmé ✓</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">Bonjour ${prenom},</p>
          <div style="background:#f0f9ff;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center">
            <p style="margin:0;font-size:13px;color:#0369a1;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Montant crédité</p>
            <p style="margin:8px 0 0;font-size:36px;font-weight:800;color:#0f172a">${amount}€</p>
          </div>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
            Votre solde a été crédité immédiatement. Vous pouvez maintenant acheter des pronostics sur la plateforme.
          </p>
          <a href="https://payperwin.co/pages/dashboard-user.html" style="display:inline-block;background:#1a56ff;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
            Voir mon solde →
          </a>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:12px;color:#94a3b8">PayPerWin · contact@payperwin.co</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function templatePronoResultat({ prenom, match, statut, montant }) {
  const isWon = statut === 'won';
  const isCancelled = statut === 'cancelled';
  const color = isWon ? '#16a34a' : isCancelled ? '#d97706' : '#dc2626';
  const emoji = isWon ? '🏆' : isCancelled ? '⊘' : '❌';
  const titre = isWon ? 'Prono gagné !' : isCancelled ? 'Match annulé — remboursé' : 'Prono perdu — remboursé';
  const message = isWon
    ? `Félicitations ! Le prono <strong>${match}</strong> est sorti gagnant. Le montant a été débité de votre solde.`
    : `Le prono <strong>${match}</strong> a été ${isCancelled ? 'annulé' : 'perdu'}. Vous avez été remboursé automatiquement de <strong>${montant}€</strong> sur votre solde.`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#1a56ff;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:800;color:white">PayPerWin</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a">${emoji} ${titre}</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6">Bonjour ${prenom},</p>
          <div style="border-left:4px solid ${color};background:${isWon?'#f0fdf4':isCancelled?'#fffbeb':'#fef2f2'};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${message}</p>
          </div>
          <a href="https://payperwin.co/pages/dashboard-user.html" style="display:inline-block;background:#1a56ff;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
            Voir mes achats →
          </a>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:12px;color:#94a3b8">PayPerWin · contact@payperwin.co</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function templateCampagne({ prenom, subject, body }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#1a56ff;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:800;color:white">PayPerWin</p>
        </td></tr>
        <tr><td style="padding:32px">
          ${prenom ? `<p style="margin:0 0 16px;font-size:15px;color:#475569">Bonjour ${prenom},</p>` : ''}
          <div style="font-size:15px;color:#374151;line-height:1.7">${body.replace(/\n/g, '<br/>')}</div>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:12px;color:#94a3b8">
            PayPerWin · contact@payperwin.co · <a href="https://payperwin.co" style="color:#94a3b8">payperwin.co</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Handler principal ──────────────────────────────────────────

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // Accès réservé aux appels internes Vercel (pas de clé exposée côté client)

  const { type, data } = req.body;

  try {
    let result;

    switch (type) {
      case 'bienvenue':
        result = await sendEmail({
          to: data.email,
          toName: data.prenom,
          subject: `Bienvenue sur PayPerWin, ${data.prenom} !`,
          html: templateBienvenue({ prenom: data.prenom, role: data.role }),
        });
        break;

      case 'depot':
        result = await sendEmail({
          to: data.email,
          toName: data.prenom,
          subject: `Dépôt de ${data.amount}€ confirmé — PayPerWin`,
          html: templateDepot({ prenom: data.prenom, amount: data.amount }),
        });
        break;

      case 'prono_resultat':
        result = await sendEmail({
          to: data.email,
          toName: data.prenom,
          subject: data.statut === 'won'
            ? `🏆 Prono gagné — ${data.match}`
            : `Résultat de votre prono — ${data.match}`,
          html: templatePronoResultat({
            prenom: data.prenom,
            match: data.match,
            statut: data.statut,
            montant: data.montant,
          }),
        });
        break;

      case 'campagne':
        // Envoi en masse — data.recipients = [{email, prenom}]
        const results = [];
        for (const r of (data.recipients || [])) {
          try {
            await sendEmail({
              to: r.email,
              toName: r.prenom,
              subject: data.subject,
              html: templateCampagne({ prenom: r.prenom, subject: data.subject, body: data.body }),
            });
            results.push({ email: r.email, ok: true });
            // Pause 100ms pour éviter le rate limit Brevo
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch(e) {
            results.push({ email: r.email, ok: false, error: e.message });
          }
        }
        return res.status(200).json({ sent: results.filter(r => r.ok).length, errors: results.filter(r => !r.ok).length, results });

      default:
        return res.status(400).json({ error: 'Type inconnu' });
    }

    res.status(200).json({ success: true, result });
  } catch(e) {
    console.error('send-email error:', e);
    res.status(500).json({ error: e.message });
  }
};
