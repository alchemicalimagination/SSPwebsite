export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const FROM = 'Studio Style Pro <noreply@studiostylepro.com>';
  const NOTIFY = 'thealchemicalimagination@gmail.com';

  try {
    // Email to you — new signup notification
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: NOTIFY,
        subject: '✦ New waitlist signup — Studio Style Pro',
        html: `<p>New signup on the waiting list:</p>
               <p><strong>Email:</strong> ${email}</p>
               ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}`,
      }),
    });

    // Confirmation email to the subscriber
    const greeting = name ? `Hi ${name},\n\n` : '';
    const textBody = `${greeting}Thank you for joining the Studio Style Pro waiting list.\nWe will be in touch as soon as we launch.\n\n— The Studio Style Pro Team\n\nstudiostylepro.com`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: 'You are on the waiting list - Studio Style Pro',
        text: textBody,
        html: `<div style="font-family:Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#0c0c0c;padding:32px 0;">
                 <p style="font-size:11px;letter-spacing:0.15em;color:#888;margin:0 0 24px;">STUDIO STYLE PRO</p>
                 <p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 16px;">${name ? `Hi ${name},<br><br>` : ''}Thank you for joining the Studio Style Pro waiting list. We will be in touch as soon as we launch.</p>
                 <p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 32px;">— The Studio Style Pro Team</p>
                 <p style="font-size:11px;color:#bbb;border-top:1px solid #eee;padding-top:16px;">You received this email because you signed up at studiostylepro.com</p>
               </div>`,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
