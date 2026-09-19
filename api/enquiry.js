const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = (s, max) => String(s == null ? '' : s).replace(/[^\P{C}\n\t]/gu, '').trim().slice(0, max);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot: bots fill this, people never see it
  if (b.t && Date.now() - Number(b.t) < 2000) return res.status(200).json({ ok: true }); // sent faster than a person can

  const one = (v, n) => clean(v, n).replace(/\s+/g, ' ');
  const name = one(b.name, 120), email = one(b.email, 160), phone = one(b.phone, 40), product = one(b.product, 160), message = clean(b.message, 3000);
  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const key = process.env.RESEND_API_KEY, to = process.env.NOTIFY_EMAIL;
  const record = JSON.stringify({ name, email, phone, product, message });
  if (!key || !to) {
    console.error('Enquiry received but email is not configured', record);
    return res.status(503).json({ error: 'not_configured' });
  }

  const rows = [['Name', name], ['Email', email], ['Phone', phone || '-'], ['Product', product || '-']];
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f1e1d">' +
    '<h2 style="margin:0 0 12px">New enquiry from the website</h2>' +
    '<table style="border-collapse:collapse">' + rows.map((r) => '<tr><td style="padding:4px 14px 4px 0;color:#6b6862">' + r[0] + '</td><td style="padding:4px 0"><b>' + esc(r[1]) + '</b></td></tr>').join('') + '</table>' +
    '<p style="margin:16px 0 4px;color:#6b6862">Message</p><div style="white-space:pre-wrap;padding:12px 14px;background:#f5f3ee;border-radius:8px">' + esc(message || '(no message)') + '</div>' +
    '<p style="margin-top:16px;color:#6b6862;font-size:13px">Reply to this email to answer ' + esc(name) + ' directly.</p></div>';
  const text = rows.map((r) => r[0] + ': ' + r[1]).join('\n') + '\n\nMessage:\n' + (message || '(no message)');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Rohit's Supply Website <onboarding@resend.dev>",
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: email,
        subject: 'New enquiry from ' + name + (product ? ' (' + product + ')' : ''),
        html, text
      })
    });
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text(), record);
      return res.status(502).json({ error: 'send_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Enquiry send failed', e.message, record);
    return res.status(502).json({ error: 'send_failed' });
  }
};
