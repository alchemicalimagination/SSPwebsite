export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, lang } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const isIt = lang === 'it';
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
               ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
               <p><strong>Language:</strong> ${isIt ? 'Italian' : 'English'}</p>`,
      }),
    });

    // Confirmation email to the subscriber
    const greeting = isIt
      ? (name ? `Ciao ${name},` : 'Ciao,')
      : (name ? `Hi ${name},` : 'Hello,');

    const bodyText = isIt
      ? `Grazie per esserti iscritta alla lista d'attesa di Studio Style Pro.<br>Ti contatteremo non appena saremo pronti al lancio.`
      : `Thank you for joining the Studio Style Pro waiting list. We build for salon owners who want to lead with confidence — and you will be the first to know when we launch.`;

    const signoff = isIt ? 'Il team di Studio Style Pro.' : '— The Studio Style Pro Team';
    const subject = isIt ? 'Sei in lista d\'attesa - Studio Style Pro' : 'You are on the waiting list - Studio Style Pro';
    const ctaLabel = isIt ? 'VISITA IL SITO' : 'VISIT THE SITE';
    const footerText = isIt
      ? `Hai ricevuto questa email perché ti sei iscritto su studiostylepro.com`
      : `You received this email because you signed up at studiostylepro.com`;

    const headline = isIt ? 'SEI NELLA<br>LISTA.' : 'YOU ARE<br>ON THE LIST.';

    const bodyTextPlain = isIt
      ? `Grazie per esserti iscritta alla lista d'attesa di Studio Style Pro.\nTi contatteremo non appena saremo pronti al lancio.`
      : bodyText;

    const textBody = isIt
      ? `STUDIO STYLE PRO\n\nSEI NELLA LISTA.\n\n${greeting}\n\n${bodyTextPlain}\n\n${signoff}\n\nstudiostylepro.com`
      : `STUDIO STYLE PRO\n\nYOU ARE ON THE LIST.\n\n${greeting}\n\n${bodyTextPlain}\n\n${signoff}\n\nstudiostylepro.com`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject,
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
            ${headline}
          </td></tr>

          <!-- Divider -->
          <tr><td style="padding-bottom:36px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td height="1" style="background:rgba(255,255,255,0.2);height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          </td></tr>

          <!-- Body -->
          <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:15px;font-weight:300;line-height:1.8;color:rgba(255,255,255,0.75);padding-bottom:40px;">
            ${greeting}<br><br>
            ${bodyText}<br><br>
            ${signoff}
          </td></tr>

          <!-- CTA -->
          <tr><td style="padding-bottom:56px;">
            <a href="https://www.studiostylepro.com" style="display:inline-block;font-family:'DM Sans',Helvetica,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.2em;color:#1a0e26;background:#ffffff;text-decoration:none;padding:16px 36px;border-radius:99px;">
              ${ctaLabel}
            </a>
          </td></tr>

          <!-- Footer -->
          <tr><td style="font-family:'DM Sans',Helvetica,sans-serif;font-size:10px;color:rgba(255,255,255,0.25);border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;line-height:1.8;">
            ${footerText}<br>
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
