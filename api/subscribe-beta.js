export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, salon_name, role, team_size, lang } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const isIt = lang === 'it';
  const FROM = 'Studio Style Pro <noreply@studiostylepro.com>';
  const NOTIFY = 'thealchemicalimagination@gmail.com';

  // Role translation for email summaries
  const roleLabels = {
    owner: isIt ? 'Titolare del Salone' : 'Salon Owner',
    manager: isIt ? 'Gestore del Salone' : 'Salon Manager',
    stylist: isIt ? 'Parrucchiere Indipendente / Stylist' : 'Independent Hairdresser / Stylist',
    other: isIt ? 'Professionista della Bellezza / Altro' : 'Beauty Professional / Other'
  };
  const roleDisplay = roleLabels[role] || role || 'N/A';

  try {
    // 1. Add to Resend Audience
    const audiencesRes = await fetch('https://api.resend.com/audiences', {
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const audiencesData = await audiencesRes.json();
    const audienceId = process.env.RESEND_AUDIENCE_ID || audiencesData?.data?.[0]?.id;

    if (audienceId) {
      const nameParts = name ? name.trim().split(' ') : [];
      await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          unsubscribed: false,
        }),
      });
    }

    // 2. Email notification to you (the owner)
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: NOTIFY,
        subject: '✦ New Private Beta Application — Studio Style Pro',
        html: `<p>A new salon has applied to join the Private Beta cohort:</p>
               <table border="0" cellpadding="8" cellspacing="0" style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:500px;">
                 <tr style="background:#f5f5f5;">
                   <td style="font-weight:bold;width:150px;">Name</td>
                   <td>${name || 'N/A'}</td>
                 </tr>
                 <tr>
                   <td style="font-weight:bold;">Email</td>
                   <td><a href="mailto:${email}">${email}</a></td>
                 </tr>
                 <tr style="background:#f5f5f5;">
                   <td style="font-weight:bold;">Salon Name</td>
                   <td>${salon_name || 'N/A'}</td>
                 </tr>
                 <tr>
                   <td style="font-weight:bold;">Role</td>
                   <td>${roleDisplay}</td>
                 </tr>
                 <tr style="background:#f5f5f5;">
                   <td style="font-weight:bold;">Team Size</td>
                   <td>${team_size || 'N/A'} stylists</td>
                 </tr>
                 <tr>
                   <td style="font-weight:bold;">Language</td>
                   <td>${isIt ? 'Italian' : 'English'}</td>
                 </tr>
               </table>`,
      }),
    });

    // 3. Confirmation email to the applicant
    const greeting = isIt
      ? (name ? `Ciao ${name},` : 'Ciao,')
      : (name ? `Hi ${name},` : 'Hello,');

    const bodyText = isIt
      ? `Grazie per aver inviato la tua candidatura per entrare nella Beta Privata di Studio Style Pro!<br><br>
         Poiché stiamo selezionando un gruppo limitato di <b>soli 10 saloni fondatori</b> per questa fase, il nostro team sta esaminando personalmente ogni richiesta.
         Analizzeremo i dettagli del tuo salone (<b>${salon_name}</b>) e ti contatteremo via email nelle prossime settimane se il tuo profilo corrisponde alla nostra ricerca.`
      : `Thank you for applying to join the Studio Style Pro Private Beta cohort!<br><br>
         Since we are inviting a small, dedicated group of <b>only 10 founding salons</b> to test the platform before the official launch, our team is personally reviewing every candidate.
         We will review your salon's details (<b>${salon_name}</b>) and get in touch with you shortly to schedule a walkthrough if there is a match.`;

    const signoff = isIt ? 'Il team di Studio Style Pro.' : '— The Studio Style Pro Team';
    const subject = isIt ? 'Candidatura Beta Ricevuta - Studio Style Pro' : 'Private Beta Application Received - Studio Style Pro';
    const ctaLabel = isIt ? 'VISITA IL SITO' : 'VISIT THE SITE';
    const encodedEmail = encodeURIComponent(email);
    const footerText = isIt
      ? `Hai ricevuto questa email perché ti sei candidata su studiostylepro.com.<br><a href="https://www.studiostylepro.com/unsubscribe?email=${encodedEmail}&lang=it" style="color:rgba(255,255,255,0.35);">Clicca qui per cancellarti</a>.`
      : `You received this email because you applied at studiostylepro.com.<br><a href="https://www.studiostylepro.com/unsubscribe?email=${encodedEmail}&lang=en" style="color:rgba(255,255,255,0.35);">Click here to unsubscribe</a>.`;

    const headline = isIt ? 'RICHIESTA<br>RICEVUTA.' : 'APPLICATION<br>RECEIVED.';

    const textBody = isIt
      ? `STUDIO STYLE PRO\n\nRICHIESTA RICEVUTA.\n\n${greeting}\n\nGrazie per aver inviato la candidatura per la Beta Privata (Salone: ${salon_name}). Vi contatteremo presto.\n\n${signoff}\n\nstudiostylepro.com`
      : `STUDIO STYLE PRO\n\nAPPLICATION RECEIVED.\n\n${greeting}\n\nThank you for applying to join the Private Beta cohort (Salon: ${salon_name}). We will be in touch shortly.\n\n${signoff}\n\nstudiostylepro.com`;

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
            &copy; 2026 Studio Style Pro
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
