const mongoose = require('mongoose');

const ticketRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  consent: {
    type: Boolean,
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventTitle: {
    type: String,
    required: true
  },
  eventUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
ticketRequestSchema.index({ email: 1, eventId: 1 });
ticketRequestSchema.index({ createdAt: -1 });

const TicketRequest = mongoose.model('TicketRequest', ticketRequestSchema);

module.exports = TicketRequest;
