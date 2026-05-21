module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message, _gotcha } = req.body;

  // Honeypot — silent discard if filled
  if (_gotcha) return res.status(200).json({ ok: true });

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Once you verify dohtts.co in Resend, change this to e.g.
      // 'Portfolio <hello@dohtts.co>'
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: ['simbaconteh1@gmail.com'],
      reply_to: email,
      subject: `Portfolio enquiry${subject ? ': ' + subject : ''}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }

  return res.status(200).json({ ok: true });
};
