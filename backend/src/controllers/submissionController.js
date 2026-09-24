const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const ApiError = require('../utils/ApiError');
const { getCompetitionStage } = require('../utils/competitionState');
const { uploadBuffer } = require('../services/storageService');

/**
 * POST /api/competitions/:id/submissions  (multipart, field name "media")
 *
 * Guarded by the same stage derivation used for display, so the rule "you
 * can only submit while submission_open AND you're confirmed-registered"
 * can never be bypassed by an app that's showing a stale/cached screen -
 * the server re-checks live state on every write, not just on read.
 */
async function createSubmission(req, res) {
  const { id: competitionId } = req.params;
  if (!req.file) throw new ApiError(400, 'A media file is required (field name "media")');

  const competition = await Competition.findById(competitionId);
  if (!competition) throw new ApiError(404, 'Competition not found');

  const stage = getCompetitionStage(competition);
  if (stage !== 'submission_open') {
    throw new ApiError(409, `Submissions are not open right now (current stage: ${stage})`);
  }

  const registration = await Registration.findOne({ competition: competitionId, user: req.user.id });
  if (!registration || registration.status !== 'confirmed') {
    throw new ApiError(403, 'You must be a confirmed participant to submit an entry');
  }

  const latest = await Submission.findOne({ competition: competitionId, user: req.user.id }).sort({ version: -1 });
  const nextVersion = latest ? latest.version + 1 : 1;

  const uploaded = await uploadBuffer({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
  });

  const submission = await Submission.create({
    competition: competitionId,
    user: req.user.id,
    registration: registration._id,
    mediaUrl: uploaded.url,
    mediaType: req.file.mimetype.startsWith('image') ? 'image' : 'video',
    version: nextVersion,
  });

  res.status(201).json({ data: submission });
}

async function getMySubmission(req, res) {
  const { id: competitionId } = req.params;
  const submission = await Submission.findOne({ competition: competitionId, user: req.user.id }).sort({ version: -1 });
  if (!submission) throw new ApiError(404, 'No submission found');
  res.json({ data: submission });
}

module.exports = { createSubmission, getMySubmission };
