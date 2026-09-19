const crypto = require('crypto');

const hmac = (data) => crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(data).digest('base64url');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

exports.safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

exports.sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + hmac(body);
};

exports.verify = (token) => {
  if (!token || !process.env.SESSION_SECRET) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = hmac(body);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch (e) { return null; }
};

exports.getCookie = (req, name) => {
  const m = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
};

exports.isAuthed = (req) => !!exports.verify(exports.getCookie(req, 'admin_session'));

exports.setSession = (res, token, maxAge) => {
  res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`);
};
