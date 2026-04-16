const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Dire à Vercel de ne PAS parser le body (Stripe a besoin du raw body)
export const config = {
  api: { bodyParser: false }
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const sig     = req.headers['stripe-signature'];
  const payload = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Paiement réussi → créditer le solde
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId  = session.metadata?.userId;
    const amount  = parseFloat(session.metadata?.amount);

    if (userId && amount > 0) {
      // Récupérer le solde actuel et total_deposits
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance, total_deposits')
        .eq('id', userId)
        .single();

      const newBalance       = (parseFloat(profile?.balance) || 0) + amount;
      const newTotalDeposits = (parseFloat(profile?.total_deposits) || 0) + amount;

      // Mettre à jour le solde et total_deposits
      await supabase
        .from('profiles')
        .update({ balance: newBalance, total_deposits: newTotalDeposits })
        .eq('id', userId);

      // Enregistrer le dépôt dans l'historique
      await supabase
        .from('deposits')
        .insert({ user_id: userId, amount: amount, method: 'stripe' });

      console.log(`✓ Solde crédité : ${amount}€ pour ${userId} (total dépôts: ${newTotalDeposits}€)`);

      // ── Bonus parrainage au premier dépôt ──────────────────
      // On vérifie si c'est le premier dépôt (total_deposits avant = 0)
      const isFirstDeposit = (parseFloat(profile?.total_deposits) || 0) === 0;
      if (isFirstDeposit) {
        const { data: newUserProfile } = await supabase
          .from('profiles')
          .select('referred_by, referral_bonus_given, role')
          .eq('id', userId)
          .single();

        const referredBy = newUserProfile?.referred_by;
        const bonusAlreadyGiven = newUserProfile?.referral_bonus_given;

        if (referredBy && !bonusAlreadyGiven) {
          // Trouver le parrain par son referral_code (insensible à la casse)
          const { data: referrers } = await supabase
            .from('profiles')
            .select('id, role, balance')
            .ilike('referral_code', referredBy);

          const referrer = referrers?.[0];

          if (referrer) {
            // +2€ au nouveau parieur
            await supabase
              .from('profiles')
              .update({ balance: newBalance + 2, referral_bonus_given: true })
              .eq('id', userId);

            // +2€ au parrain seulement si c'est un user (pas un tipster)
            if (referrer.role === 'user') {
              await supabase
                .from('profiles')
                .update({ balance: (parseFloat(referrer.balance) || 0) + 2 })
                .eq('id', referrer.id);
              // Tracer le parrainage
              await supabase.from('referrals').insert({
                referrer_id: referrer.id,
                referred_id: userId,
                referrer_code: referredBy,
                amount_referrer: 2,
                amount_referred: 2,
              });
              console.log(`✓ Bonus parrainage : +2€ pour ${userId} et +2€ pour parrain ${referrer.id}`);
            } else {
              // Parrain tipster — pas de bonus pour lui mais on trace quand même
              await supabase.from('referrals').insert({
                referrer_id: referrer.id,
                referred_id: userId,
                referrer_code: referredBy,
                amount_referrer: 0,
                amount_referred: 2,
              });
              console.log(`✓ Bonus parrainage : +2€ pour ${userId} (parrain tipster, pas de bonus)`);
            }
          }
        }
      }
      // ── Fin bonus parrainage ────────────────────────────────
    }
  }

  res.status(200).json({ received: true });
};
