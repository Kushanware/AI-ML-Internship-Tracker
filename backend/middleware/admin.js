function admin(req, res, next) {
  const required = process.env.ADMIN_TOKEN;
  if (!required) return next(); // dev fallback
  const token = req.headers['x-admin-token'];
  if (!token || token !== required) return res.status(401).json({ error: 'Admin token required' });
  next();
}

module.exports = admin;