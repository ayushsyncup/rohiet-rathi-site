const { safeEqual, sign, setSession } = require('./_auth');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id = '', password = '' } = req.body || {};
  const okId = safeEqual(String(id).trim().toLowerCase(), String(process.env.ADMIN_ID || '').toLowerCase());
  const okPw = safeEqual(password, process.env.ADMIN_PASSWORD || '');
  if (!okId || !okPw || !process.env.SESSION_SECRET) {
    await new Promise((r) => setTimeout(r, 800));
    return res.status(401).json({ error: 'Wrong ID or password.' });
  }
  const maxAge = 12 * 60 * 60;
  setSession(res, sign({ id: 'admin', exp: Date.now() + maxAge * 1000 }), maxAge);
  return res.status(200).json({ ok: true });
};
