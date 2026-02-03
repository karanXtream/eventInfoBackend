const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

/**
 * GET /api/events
 * Get all active events
 */
router.get('/', async (req, res) => {
  try {
    const { source, status = 'new,updated', limit = 100 } = req.query;

    const query = {
      status: { $in: status.split(',') }
    };

    if (source) {
      query['source.name'] = source;
    }

    const events = await Event.find(query)
      .sort({ dateTime: 1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      source: source || 'All Sources',
      count: events.length,
      events: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Event.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const sourceStats = await Event.aggregate([
      {
        $match: { status: { $in: ['new', 'updated'] } }
      },
      {
        $group: {
          _id: '$source.name',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Event.countDocuments();

    res.json({
      total,
      byStatus: stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      bySource: sourceStats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/events/:id
 * Get single event by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

module.exports = router;
