module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, prenom, listId } = req.body;
  if (!email || !listId) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: { PRENOM: prenom || '' },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    // 204 = déjà existant mis à jour, 201 = créé
    if (response.status === 201 || response.status === 204) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json().catch(() => ({}));
    // Code 16 = contact déjà dans la liste (pas une erreur)
    if (data.code === 'duplicate_parameter') {
      return res.status(200).json({ success: true, info: 'already exists' });
    }

    console.error('Brevo sync error:', data);
    return res.status(200).json({ success: false, error: data.message });

  } catch (e) {
    console.error('sync-brevo error:', e.message);
    return res.status(200).json({ success: false, error: e.message });
  }
};
