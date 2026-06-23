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
<body style="margin:0;padding:0;" bgcolor="#3a3448">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#3a3448"
  background="https://www.studiostylepro.com/flower%20sequence/ezgif-8a7cfed939556aa3-jpg/ezgif-frame-060.jpg"
  style="background-image:url('https://www.studiostylepro.com/flower%20sequence/ezgif-8a7cfed939556aa3-jpg/ezgif-frame-060.jpg');background-size:cover;background-position:center top;background-repeat:no-repeat;">
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="background:rgba(22,14,38,0.72);padding:56px 24px 48px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

          <!-- Logo -->
          <tr><td style="padding-bottom:48px;">
            <img src="https://www.studiostylepro.com/assets/logo.png" width="140" alt="Studio Style Pro" style="display:block;width:140px;height:auto;">
          </td></tr>

          <!-- Headline -->
          <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:48px;font-weight:200;line-height:0.95;letter-spacing:-0.03em;color:#ffffff;padding-bottom:40px;">
            YOU ARE<br>ON THE LIST.
          </td></tr>

          <!-- Divider -->
          <tr><td style="padding-bottom:36px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td height="1" style="background:rgba(255,255,255,0.2);height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td></tr>

          <!-- Body -->
          <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:15px;font-weight:300;line-height:1.8;color:rgba(255,255,255,0.75);padding-bottom:40px;">
            ${greeting}<br><br>
            Thank you for joining the Studio Style Pro waiting list.
            We build for salon owners who want to lead with confidence —
            and you will be the first to know when we launch.<br><br>
            — The Studio Style Pro Team
          </td></tr>

          <!-- CTA -->
          <tr><td style="padding-bottom:56px;">
            <a href="https://www.studiostylepro.com" style="display:inline-block;font-family:'DM Sans',Helvetica,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.2em;color:#1a0e26;background:#ffffff;text-decoration:none;padding:16px 36px;border-radius:99px;">
              VISIT THE SITE
            </a>
          </td></tr>

          <!-- Footer -->
          <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:10px;color:rgba(255,255,255,0.25);border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;line-height:1.8;">
            You received this email because you signed up at studiostylepro.com<br>
            &copy; 2025 Studio Style Pro
          </td></tr>

        </table>
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
