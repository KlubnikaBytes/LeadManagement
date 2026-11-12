const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    calledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    callDate: { type: Date, required: true, default: Date.now },
    duration: { type: String, default: '0:00' },
    outcome: {
      type: String,
      enum: ['Connected','No Answer','Busy','Call Back Requested','Interested','Not Interested','Wrong Number','Converted'],
      required: true,
    },
    notes: { type: String, trim: true },
    nextFollowUpAt: { type: Date },
    nextFollowUpType: { type: String },
  },
  { timestamps: true }
);

callSchema.index({ callDate: -1 });

module.exports = mongoose.model('Call', callSchema);
