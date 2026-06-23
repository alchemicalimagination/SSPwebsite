export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const payload = {
    email,
    listIds: [3],
    updateEnabled: true,
  };

  if (name) {
    payload.attributes = { FIRSTNAME: name };
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (brevoRes.status === 201 || brevoRes.status === 204) {
      return res.status(200).json({ success: true });
    }

    const data = await brevoRes.json();
    return res.status(500).json({ error: data.message || 'Brevo error' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
