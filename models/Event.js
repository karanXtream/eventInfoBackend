const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: String,
  description: String,
  dateTime: Date,
  venue: String,
  address: String,
  city: { type: String, default: 'Sydney' },

  category: [String],
  imageUrl: String,

  source: {
    name: String,
    eventUrl: { type: String, unique: true }
  },

  hash: String,
  status: {
    type: String,
    enum: ['new', 'updated', 'inactive', 'imported'],
    default: 'new'
  },
  inactiveReason: String, // Why event was marked inactive

  lastScrapedAt: Date,
  importedAt: Date,
  importedBy: String,
  importNotes: String
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
