const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * Minimal storage abstraction so the rest of the app never talks to disk or
 * S3 directly. Swapping STORAGE_PROVIDER=s3 in production means implementing
 * `uploadBuffer` against the S3 SDK here - nothing else changes.
 */
async function uploadBuffer({ buffer, filename, mimetype }) {
  if (process.env.STORAGE_PROVIDER === 's3') {
    // Left as a documented stub - wiring a real bucket needs credentials
    // this assignment doesn't have. See README for the intended shape
    // (multipart upload via a pre-signed URL, not proxying big video files
    // through this API process).
    throw new Error('S3 storage provider not configured in this environment');
  }

  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  await fs.promises.writeFile(filePath, buffer);
  return { url: `/uploads/${safeName}`, mimetype };
}

module.exports = { uploadBuffer, UPLOAD_DIR };
