const rateLimit = require('express-rate-limit');

// General API traffic
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration is the endpoint most likely to be hammered the moment a
// popular competition's spots open up (or by a script trying to snipe
// spots) - kept tighter, and keyed per-user (falls back to IP when
// unauthenticated requests reach it, which requireAuth blocks anyway).
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many registration attempts - please slow down and try again shortly.' },
});

module.exports = { generalLimiter, registerLimiter };
