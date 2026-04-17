module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { role, email, prenom, nom } = req.body;
  if (!role || !email) return res.status(400).json({ error: 'Paramètres manquants' });

  const isTipster = role === 'tipster';
  const webhookUrl = isTipster
    ? process.env.SLACK_WEBHOOK_NEW_TIPSTER
    : process.env.SLACK_WEBHOOK_NEW_USER;

  if (!webhookUrl) return res.status(500).json({ error: 'Webhook non configuré' });

  const nom_complet = isTipster ? prenom : `${prenom} ${nom}`.trim();
  const emoji = isTipster ? '📊' : '🎯';
  const label = isTipster ? 'Nouveau tipster' : 'Nouvel utilisateur';

  const message = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${label} inscrit !` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Nom :*\n${nom_complet || '—'}` },
          { type: 'mrkdwn', text: `*Email :*\n${email}` },
        ]
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Inscrit le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` }]
      }
    ]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    res.status(200).json({ success: true });
  } catch(e) {
    console.error('slack-notify error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
