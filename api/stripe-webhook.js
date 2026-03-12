const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const sig     = req.headers['stripe-signature'];
  const payload = req.body;

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
      // Récupérer le solde actuel
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      const newBalance = (parseFloat(profile?.balance) || 0) + amount;

      // Mettre à jour le solde
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

      console.log(`✓ Solde crédité : ${amount}€ pour ${userId}`);
    }
  }

  res.status(200).json({ received: true });
};
