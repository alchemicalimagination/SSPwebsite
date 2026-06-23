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
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: 'You\'re on the list — Studio Style Pro',
        html: `<div style="font-family:Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#0c0c0c;">
                 <p style="font-size:12px;letter-spacing:0.2em;color:#888;">STUDIO STYLE PRO</p>
                 <h1 style="font-size:32px;font-weight:200;line-height:1.1;margin:8px 0 24px;">YOU'RE ON<br>THE LIST.</h1>
                 <p style="font-size:15px;line-height:1.6;color:#444;">
                   ${name ? `Hi ${name},<br><br>` : ''}
                   Thank you for joining the Studio Style Pro waiting list.
                   We'll be in touch as soon as we launch.
                 </p>
                 <p style="font-size:15px;line-height:1.6;color:#444;margin-top:24px;">
                   — The Studio Style Pro Team
                 </p>
                 <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
                 <p style="font-size:11px;color:#aaa;">
                   You're receiving this because you signed up at studiostylepro.com
                 </p>
               </div>`,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
