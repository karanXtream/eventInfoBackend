const express = require('express');
const router = express.Router();
const TicketRequest = require('../models/TicketRequest');

// POST /api/ticket-requests - Create a new ticket request
router.post('/', async (req, res) => {
  try {
    const { email, consent, eventId, eventTitle, eventUrl } = req.body;

    // Validate required fields
    if (!email || !eventId || !eventTitle || !eventUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate consent
    if (consent !== true) {
      return res.status(400).json({
        success: false,
        message: 'Consent is required'
      });
    }

    // Create ticket request
    const ticketRequest = new TicketRequest({
      email,
      consent,
      eventId,
      eventTitle,
      eventUrl
    });

    await ticketRequest.save();

    res.status(201).json({
      success: true,
      message: 'Ticket request saved successfully',
      data: {
        id: ticketRequest._id,
        email: ticketRequest.email,
        eventTitle: ticketRequest.eventTitle
      }
    });
  } catch (error) {
    console.error('Error creating ticket request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/ticket-requests - Get all ticket requests (for admin)
router.get('/', async (req, res) => {
  try {
    const ticketRequests = await TicketRequest.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: ticketRequests.length,
      data: ticketRequests
    });
  } catch (error) {
    console.error('Error fetching ticket requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/ticket-requests/email/:email - Get requests by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const ticketRequests = await TicketRequest.find({ 
      email: email.toLowerCase() 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ticketRequests.length,
      data: ticketRequests
    });
  } catch (error) {
    console.error('Error fetching ticket requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
