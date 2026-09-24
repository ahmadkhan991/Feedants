const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = new Set(['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png']);
const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200MB - dance videos aren't tiny

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new ApiError(415, `Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { submissionUpload: upload.single('media') };
