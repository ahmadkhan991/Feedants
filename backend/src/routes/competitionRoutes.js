const express = require('express');
const { attachUserIfPresent, requireAuth } = require('../middleware/auth');
const { registerLimiter } = require('../middleware/rateLimiter');
const { submissionUpload } = require('../middleware/upload');
const { getCompetitionDetails } = require('../controllers/competitionController');
const { register, getMyRegistration, cancelRegistration } = require('../controllers/registrationController');
const { createSubmission, getMySubmission } = require('../controllers/submissionController');

const router = express.Router();

router.get('/:idOrSlug', attachUserIfPresent, getCompetitionDetails);

router.post('/:id/register', requireAuth, registerLimiter, register);
router.get('/:id/registration/me', requireAuth, getMyRegistration);
router.post('/:id/registration/cancel', requireAuth, cancelRegistration);

router.post('/:id/submissions', requireAuth, submissionUpload, createSubmission);
router.get('/:id/submissions/me', requireAuth, getMySubmission);

module.exports = router;
