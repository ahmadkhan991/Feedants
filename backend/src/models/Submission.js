const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },

    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['video', 'image'], default: 'video' },

    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
    },
    rejectionReason: { type: String, default: null },

    // Submissions can be re-uploaded until the window closes; we keep every
    // version rather than overwriting, in case of judging disputes.
    version: { type: Number, default: 1 },

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A user may have multiple *versions* (re-uploads) but conceptually one
// active submission per competition - enforced at the service layer by
// always querying/upserting on (competition, user) and bumping `version`,
// so the index protects against accidental duplicate documents at the same
// version rather than blocking legitimate re-uploads.
submissionSchema.index({ competition: 1, user: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
