const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// A full auth system (refresh tokens, email verification, password reset)
// is out of scope for this assignment - this is deliberately just enough
// to issue a JWT so the competition/registration/submission flow can be
// exercised and demoed end-to-end. See README.

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  referralCode: z.string().optional(),
});

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function signup(req, res) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, 'Invalid input', parsed.error.flatten());
  const { name, email, password, referralCode } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) referredBy = referrer._id;
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, referredBy });

  res.status(201).json({ data: { user: user.toPublicJSON(), token: signToken(user) } });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ data: { user: user.toPublicJSON(), token: signToken(user) } });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ data: user.toPublicJSON() });
}

module.exports = { signup, login, me };
