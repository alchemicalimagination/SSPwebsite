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
    const greeting = name ? `Hi ${name},` : 'Hello,';
    const textBody = `STUDIO STYLE PRO\n\nYOU ARE ON THE LIST.\n\n${greeting}\n\nThank you for joining the Studio Style Pro waiting list. We will be in touch as soon as we launch.\n\n— The Studio Style Pro Team\n\nstudiostylepro.com`;

    const globeSvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="0.35" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9.5"/><ellipse cx="12" cy="12" rx="9.5" ry="3.5"/><ellipse cx="12" cy="12" rx="3.5" ry="9.5"/><ellipse cx="12" cy="12" rx="3.5" ry="9.5" transform="rotate(45 12 12)"/><ellipse cx="12" cy="12" rx="3.5" ry="9.5" transform="rotate(-45 12 12)"/><path fill="rgba(255,255,255,0.85)" stroke="none" d="M12 7.5 L13.2 10.8 L16.5 12 L13.2 13.2 L12 16.5 L10.8 13.2 L7.5 12 L10.8 10.8 Z"/></svg>`;

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
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0c0c0c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0c;min-height:100vh;">
  <tr><td align="center" style="padding:48px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

      <!-- Logo -->
      <tr><td style="padding-bottom:40px;">
        ${globeSvg}
      </td></tr>

      <!-- Eyebrow -->
      <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.22em;color:rgba(255,255,255,0.4);padding-bottom:16px;">
        STUDIO STYLE PRO
      </td></tr>

      <!-- Headline -->
      <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:42px;font-weight:200;line-height:1.0;letter-spacing:-0.02em;color:#ffffff;padding-bottom:32px;">
        YOU ARE<br>ON THE LIST.
      </td></tr>

      <!-- Divider -->
      <tr><td style="height:1px;background:rgba(255,255,255,0.1);padding:0;margin:0 0 32px;">&nbsp;</td></tr>

      <!-- Body -->
      <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:15px;font-weight:300;line-height:1.75;color:rgba(255,255,255,0.75);padding-bottom:32px;">
        ${greeting}<br><br>
        Thank you for joining the Studio Style Pro waiting list.
        We build for salon owners who want to lead with confidence —
        and you will be the first to know when we launch.<br><br>
        — The Studio Style Pro Team
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding-bottom:48px;">
        <a href="https://www.studiostylepro.com" style="display:inline-block;font-family:'DM Sans',Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;color:#0c0c0c;background:#ffffff;text-decoration:none;padding:14px 32px;border-radius:99px;">
          VISIT THE SITE
        </a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;line-height:1.6;">
        You received this email because you signed up at studiostylepro.com<br>
        &copy; 2025 Studio Style Pro
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
