const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

/**
 * GET /api/events
 * Public listing
 * Filters: city, status, keyword, date range
 */
router.get('/', async (req, res) => {
  try {
    const {
      city,
      status,
      keyword,
      startDate,
      endDate
    } = req.query;

    const query = {};

    // Only filter by city if specified
    if (city) query.city = city;
    
    // Default: show new and updated events (not inactive or imported)
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['new', 'updated'] };
    }

    if (keyword) {
      query.$or = [
        { title: new RegExp(keyword, 'i') },
        { venue: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') }
      ];
    }

    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) query.dateTime.$gte = new Date(startDate);
      if (endDate) query.dateTime.$lte = new Date(endDate);
    }

    console.log('Events query:', JSON.stringify(query));
    
    const events = await Event.find(query)
      .sort({ dateTime: 1 })
      .limit(100);

    console.log(`Found ${events.length} events`);

    res.json({
      count: events.length,
      events
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({
      error: 'Failed to fetch events',
      details: err.message
    });
  }
});

/**
 * GET /api/events/:id
 * Event detail (admin preview)
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch event',
      details: err.message
    });
  }
});

module.exports = router;
