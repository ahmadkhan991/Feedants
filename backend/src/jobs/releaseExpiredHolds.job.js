const cron = require('node-cron');
const { releaseExpiredHolds } = require('../services/registrationService');

/**
 * Runs every minute. Keeps `spotsRemaining` from being permanently eaten by
 * users who reserved a spot, opened the payment sheet, and then abandoned
 * it (closed the app, payment failed, etc).
 */
function startReleaseExpiredHoldsJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const released = await releaseExpiredHolds();
      if (released > 0) {
        // eslint-disable-next-line no-console
        console.log(`[releaseExpiredHolds] released ${released} expired hold(s)`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[releaseExpiredHolds] failed:', err);
    }
  });
}

module.exports = { startReleaseExpiredHoldsJob };
