/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Competition = require('../models/Competition');

async function seed() {
  await connectDB();
  await Competition.deleteOne({ slug: 'feedants-classical-dance' });

  const now = new Date();
  const day = (offset) => new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);

  await Competition.create({
    title: 'Feedants Classical Dance',
    slug: 'feedants-classical-dance',
    tags: ['Dance', 'Multi-Win'],
    hasCertificateForWinners: true,

    prizePoolPaise: 1500 * 100,
    entryFeePaise: 99 * 100,

    totalSpots: 20,
    spotsRemaining: 19, // "1 / 20 Booked" in the design

    judge: {
      name: 'Manju Dubey',
      title: 'Professional Kathak Dancer',
      experienceLabel: '12+ Years of Experience',
      photoUrl: 'https://example.com/judges/manju-dubey.jpg',
      introVideoUrl: 'https://example.com/videos/manju-dubey-intro.mp4',
    },

    // Chosen relative to "now" so the seeded competition is always in an
    // interesting, currently-open state when you demo it, regardless of
    // when you run this script - see README.
    registrationOpensAt: null,
    registrationClosesAt: day(1.27), // ~1d 6h 28m out, matching the countdown in the design
    submissionStartsAt: day(-2),
    submissionEndsAt: day(20),
    resultDate: day(22),

    rewards: [
      { position: 1, label: '1st Winner', amountPaise: 550 * 100 },
      { position: 2, label: '2nd Winner', amountPaise: 300 * 100 },
      { position: 3, label: '3rd Winner', amountPaise: 240 * 100 },
      { position: 4, label: '4th Winner', amountPaise: 200 * 100 },
      { position: 5, label: '5th Winner', amountPaise: 130 * 100 },
      { position: 6, label: '6th Winner', amountPaise: 80 * 100 },
    ],

    previousWinners: [
      { name: 'Riya Shah', position: 1, positionLabel: '1st Winner', avatarUrl: null, videoUrl: null },
      { name: 'Aarav Mehta', position: 1, positionLabel: '1st Winner', avatarUrl: null, videoUrl: null },
      { name: 'Neha Verma', position: 2, positionLabel: '2nd Winner', avatarUrl: null, videoUrl: null },
      { name: 'Ishita Chopra', position: 3, positionLabel: '3rd Winner', avatarUrl: null, videoUrl: null },
    ],

    content: {
      aboutCompetition:
        'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.',
      judgingParameters: 'Technique, expression, costume & presentation, and adherence to classical form.',
      rulesAndEligibility: 'Open to all age groups. One entry per participant. Entry must be an original, unedited performance.',
    },

    disclaimer: 'Only contributions from paid participants will be considered for judging.',
    prizeMoneyInfoVideoUrl: 'https://example.com/videos/how-you-receive-prize-money.mp4',
    refundPolicyUrl: 'https://feedants.com/refund-policy',
    paymentProvider: 'razorpay',

    referral: { enabled: true, earnPerSignupPaise: 10 * 100 },

    status: 'published',
  });

  console.log('[seed] created "Feedants Classical Dance" competition');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
