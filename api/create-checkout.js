const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Autoriser les requêtes depuis le site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { amount, userId } = req.body;

    // Vérifications
    if (!amount || amount < 5) {
      return res.status(400).json({ error: 'Montant minimum : 5€' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Utilisateur non identifié' });
    }

    // Créer la session Stripe Checkout
    // Sans payment_method_types : Stripe affiche automatiquement
    // Apple Pay / Google Pay en premier selon l'appareil
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Recharge Paris-Bet',
              description: `Recharge de ${amount}€ sur votre solde Paris-Bet`,
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/pages/dashboard-user.html?payment=success&amount=${amount}`,
      cancel_url:  `${process.env.SITE_URL}/pages/dashboard-user.html?payment=cancelled`,
      metadata: {
        userId,
        amount: amount.toString(),
      },
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};
