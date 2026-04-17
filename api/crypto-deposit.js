const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const WALLET = '0xb2b6ff0c9c29c745129489f4a24cdfbc837cf730';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, amountEur } = req.body;
  if (!userId || !amountEur) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    // Récupérer infos user depuis Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    const email = user?.email || '—';
    const prenom = profile?.first_name || '—';
    const nom = profile?.last_name || '—';

    // Récupérer le taux USDC/EUR depuis CoinGecko
    let amountUsdc = amountEur;
    let rateInfo = '';
    try {
      const rateResp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur');
      const rateData = await rateResp.json();
      const eurPerUsdc = rateData['usd-coin']?.eur || 1;
      amountUsdc = (amountEur / eurPerUsdc).toFixed(2);
      rateInfo = `1 USDC ≈ ${eurPerUsdc.toFixed(4)} €`;
    } catch(e) {
      amountUsdc = amountEur; // fallback 1:1
      rateInfo = 'Taux non disponible (1:1 utilisé)';
    }

    // Envoyer notification Slack
    const slackMessage = {
      text: '💰 *Nouveau dépôt crypto en attente*',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '💰 Nouveau dépôt crypto — À valider' }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Utilisateur :*\n${prenom} ${nom}` },
            { type: 'mrkdwn', text: `*Email :*\n${email}` },
            { type: 'mrkdwn', text: `*Montant attendu :*\n${amountEur} € (≈ ${amountUsdc} USDC)` },
            { type: 'mrkdwn', text: `*Réseau :*\nArbitrum One` },
          ]
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Taux :* ${rateInfo}\n*Wallet :* \`${WALLET}\`` }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '🔍 Vérifier sur Arbiscan' },
              url: `https://arbiscan.io/address/${WALLET}`,
              style: 'primary'
            }
          ]
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `User ID : \`${userId}\` · Après vérification, crédite manuellement dans Supabase` }]
        }
      ]
    };

    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    res.status(200).json({ success: true, amountUsdc });

  } catch(e) {
    console.error('crypto-deposit error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
