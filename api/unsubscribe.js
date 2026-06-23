export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const audiencesRes = await fetch('https://api.resend.com/audiences', {
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const audiencesData = await audiencesRes.json();
    const audienceId = process.env.RESEND_AUDIENCE_ID || audiencesData?.data?.[0]?.id;

    if (!audienceId) return res.status(500).json({ error: 'No audience found' });

    await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: true }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
