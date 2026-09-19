const { list, put } = require('@vercel/blob');
const { isAuthed } = require('./_auth');

async function readPublished(req, fresh) {
  const { blobs } = await list({ prefix: 'content.json', limit: 1 });
  const hit = blobs.find((b) => b.pathname === 'content.json');
  if (hit) {
    const r = await fetch(hit.url + (fresh ? '?v=' + Date.now() : ''), { cache: 'no-store' });
    if (r.ok) return r.text();
  }
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const r = await fetch(`${proto}://${req.headers.host}/content.json`);
  if (!r.ok) throw new Error('No content available');
  return r.text();
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const fresh = isAuthed(req) && req.query && req.query.fresh;
      const body = await readPublished(req, fresh);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', fresh ? 'no-store' : 'public, s-maxage=30, stale-while-revalidate=120');
      return res.status(200).send(body);
    }
    if (req.method === 'PUT') {
      if (!isAuthed(req)) return res.status(401).json({ error: 'Not signed in' });
      const data = req.body;
      if (!data || typeof data !== 'object' || !data.main || !data.company || !data.rohits) return res.status(400).json({ error: 'That does not look like the site content.' });
      const text = JSON.stringify(data, null, 2);
      if (text.length > 600000) return res.status(413).json({ error: 'Content is too large.' });
      const opts = { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 };
      await put('content.json', text, opts);
      await put('history/content-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json', text, { ...opts, allowOverwrite: false });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
