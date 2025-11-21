const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function optionalAuth(req, res, next) {
  // Try cookie first, then Authorization header
  let token = req.cookies?.sessionToken;

  if (!token) {
    const auth = req.headers.authorization;
    if (auth) {
      const parts = auth.split(' ');
      if (parts.length === 2) {
        token = parts[1];
      }
    }
  }

  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = { id: payload.id, email_address: payload.email_address }
  } catch (err) {
    // ignore invalid token for optional auth
  }
  return next()
}

function requireAuth(req, res, next) {
  // Try cookie first, then Authorization header
  let token = req.cookies?.sessionToken;

  if (!token) {
    const auth = req.headers.authorization;
    if (auth) {
      const parts = auth.split(' ');
      if (parts.length === 2) {
        token = parts[1];
      }
    }
  }

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = { id: payload.id, email_address: payload.email_address }
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { optionalAuth, requireAuth }
