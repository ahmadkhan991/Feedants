const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const ApiError = require('../utils/ApiError');
const { serializeCompetition } = require('../utils/serializeCompetition');

/**
 * GET /api/competitions/:idOrSlug
 *
 * Public endpoint (auth optional - req.user is set by `attachUserIfPresent`
 * when a valid token is supplied). When authenticated, the response is
 * personalized with the viewer's own registration/submission state so the
 * app never has to stitch that together from separate calls.
 */
async function getCompetitionDetails(req, res) {
  const { idOrSlug } = req.params;
  const query = idOrSlug.match(/^[a-f0-9]{24}$/i) ? { _id: idOrSlug } : { slug: idOrSlug };

  const competition = await Competition.findOne({ ...query, status: { $ne: 'draft' } });
  if (!competition) throw new ApiError(404, 'Competition not found');

  let registration = null;
  let submission = null;
  if (req.user) {
    registration = await Registration.findOne({ competition: competition._id, user: req.user.id });
    if (registration && registration.status === 'confirmed') {
      submission = await Submission.findOne({ competition: competition._id, user: req.user.id }).sort({ version: -1 });
    }
  }

  res.json({ data: serializeCompetition(competition, { registration, submission }) });
}

module.exports = { getCompetitionDetails };
