const { put } = require('@vercel/blob');
const { isAuthed } = require('./_auth');

const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not signed in' });
  try {
    const { name = 'image', type = '', data = '' } = req.body || {};
    if (!TYPES.includes(type)) return res.status(400).json({ error: 'Only image files can be uploaded.' });
    const buf = Buffer.from(data, 'base64');
    if (!buf.length || buf.length > 3.3 * 1024 * 1024) return res.status(413).json({ error: 'Image is too large (max about 3 MB).' });
    const safe = String(name).toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').slice(-60);
    const out = await put('uploads/' + Date.now() + '-' + safe, buf, { access: 'public', addRandomSuffix: false, contentType: type, cacheControlMaxAge: 31536000 });
    return res.status(200).json({ url: out.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
