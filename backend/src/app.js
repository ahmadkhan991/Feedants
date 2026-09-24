require('express-async-errors'); // lets thrown errors in async route handlers reach errorHandler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { UPLOAD_DIR } = require('./services/storageService');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// The Razorpay webhook needs the RAW request body for signature
// verification (byte-for-byte, not a re-serialized JS object), so it gets
// its own express.raw() parser scoped to that exact path, mounted before
// the global express.json() below. body-parser marks req._body once a
// parser has run, so express.json() correctly skips re-parsing this path
// once it reaches it - order here is what makes both routes work.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(generalLimiter);

app.use('/uploads', express.static(UPLOAD_DIR)); // dev-only; S3/CDN in production, see README

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/competitions', competitionRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
