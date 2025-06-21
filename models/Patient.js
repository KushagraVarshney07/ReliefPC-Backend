const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  phone: {
    type: String,
    trim: true,
    minlength: 10,
    maxlength: 10
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  condition: {
    type: String,
    trim: true
  },
  treatment: {
    type: String,
    trim: true
  },
  visitDate: {
    type: Date,
    default: Date.now
  },
  followUpDate: {
    type: Date
  },
  diabetes: {
    type: String,
    enum: ['No Diabetes', 'Type 1 Diabetes', 'Type 2 Diabetes', 'Gestational Diabetes', 'Prediabetes']
  },
  amountPaid: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Create a compound index to prevent exact duplicates (same person, same date)
patientSchema.index({ name: 1, phone: 1, visitDate: 1 }, { unique: true });

module.exports = mongoose.model("Patient", patientSchema);
