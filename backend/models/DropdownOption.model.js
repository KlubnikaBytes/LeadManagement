const mongoose = require('mongoose');

const dropdownOptionSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      enum: ['businessCategory', 'businessSubCategory', 'typeOfReach', 'interestedIn', 'status'],
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    parentCategory: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

dropdownOptionSchema.index({ field: 1, value: 1, parentCategory: 1 }, { unique: true });

module.exports = mongoose.model('DropdownOption', dropdownOptionSchema);

