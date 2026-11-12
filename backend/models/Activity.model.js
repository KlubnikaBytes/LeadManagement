const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'LEAD_CREATED','LEAD_UPDATED','STATUS_CHANGED','CALL_LOGGED',
        'NOTE_ADDED','FOLLOWUP_CREATED','FOLLOWUP_COMPLETED','FOLLOWUP_RESCHEDULED',
        'LEAD_ASSIGNED','LEAD_REASSIGNED','LEAD_CONVERTED','LEAD_DELETED',
      ],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
