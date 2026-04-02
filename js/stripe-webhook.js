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

      console.log(`✓ Solde crédité : ${amount}€ pour ${userId} (total dépôts: ${newTotalDeposits}€)`);

      // Enregistrer le dépôt dans la table deposits
      const paymentMethod = session.payment_method_types?.[0] || 'card';
      const methodMap = { card: 'card', paypal: 'paypal' };
      await supabase.from('deposits').insert({
        user_id: userId,
        amount:  amount,
        method:  methodMap[paymentMethod] || 'card',
      });
    }
  }

  res.status(200).json({ received: true });
};
