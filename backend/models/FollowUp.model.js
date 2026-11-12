const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followUpDate: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: ['Call','Meeting','WhatsApp','Email','Demo','Proposal','Other'],
      default: 'Call',
    },
    note: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING','COMPLETED','MISSED','CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    completedAt: { type: Date },
    rescheduleNote: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FollowUp', followUpSchema);
