const { isAuthed } = require('./_auth');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(isAuthed(req) ? 200 : 401).json({ ok: isAuthed(req) });
};
