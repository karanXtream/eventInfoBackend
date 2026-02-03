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
      city = 'Sydney',
      status,
      keyword,
      startDate,
      endDate
    } = req.query;

    const query = { city };

    if (status) query.status = status;

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

    const events = await Event.find(query)
      .sort({ dateTime: 1 })
      .limit(100);

    res.json({
      count: events.length,
      events
    });
  } catch (err) {
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
