const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    // Point of Contact (POC) Details
    name: { type: String, required: [true, 'POC name is required'], trim: true },
    pocJobTitle: { type: String, trim: true },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      index: true,
    },
    alternatePhone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    pocLinkedIn: { type: String, trim: true },
    pocTalkNotes: { type: String, trim: true },

    // Prospective Business Information
    companyName: { type: String, trim: true },
    businessCategory: { type: String, trim: true, index: true },
    businessSubCategory: { type: String, trim: true },
    businessType: { type: String, trim: true }, // Legacy/alias for businessCategory
    website: { type: String, trim: true, index: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    pincode: { type: String, trim: true },
    businessDescription: { type: String, trim: true },

    // Type of Reach (Outreach Channel)
    typeOfReach: { type: String, trim: true, default: 'Cold Call' },
    source: {
      type: String,
      default: 'Manual Entry',
    },
    reachNotes: { type: String, trim: true },

    // Sales & Engagement Info
    status: {
      type: String,
      default: 'NEW',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedByName: { type: String, trim: true },
    primaryAssignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    primaryAssignedAt: { type: Date },
    reassignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reassignedAt: { type: Date },
    assignmentHistory: [
      {
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: ['PRIMARY', 'REASSIGN'], default: 'PRIMARY' },
        assignedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
      },
    ],
    interestedIn: { type: String, trim: true },
    estimatedBudget: { type: String, trim: true },
    notes: { type: String, trim: true },
    lastContactedAt: { type: Date, index: true },
    nextFollowUpAt: { type: Date, index: true },
    totalCalls: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    convertedAt: { type: Date },
    convertedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    conversionNotes: { type: String },
    finalService: { type: String },
    finalBudget: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leadSchema.index({
  name: 'text',
  companyName: 'text',
  email: 'text',
  phone: 'text',
  pocJobTitle: 'text',
  businessCategory: 'text'
});
leadSchema.index({ createdAt: -1 });
leadSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
