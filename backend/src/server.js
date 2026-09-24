require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { startReleaseExpiredHoldsJob } = require('./jobs/releaseExpiredHolds.job');

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB();
  startReleaseExpiredHoldsJob();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on port ${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start:', err);
  process.exit(1);
});
