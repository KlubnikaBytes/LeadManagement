const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['FOLLOW_UP_DUE','FOLLOW_UP_OVERDUE','LEAD_ASSIGNED','LEAD_REASSIGNED','LEAD_UPDATE','GENERAL'],
      default: 'GENERAL',
    },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
