const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

function decodeToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { id: payload.sub, email: payload.email };
  } catch (err) {
    return null;
  }
}

/** Populates req.user when a valid token is present; never rejects. */
function attachUserIfPresent(req, res, next) {
  req.user = decodeToken(req);
  next();
}

/** Rejects with 401 when no valid token is present. */
function requireAuth(req, res, next) {
  req.user = decodeToken(req);
  if (!req.user) throw new ApiError(401, 'Authentication required');
  next();
}

module.exports = { attachUserIfPresent, requireAuth };
