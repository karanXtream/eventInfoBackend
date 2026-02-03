const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authRoutes = require('./auth.routes');
const authenticateToken = authRoutes.authenticateToken;

// @route   GET /api/dashboard/events
// @desc    Get filtered events for dashboard (protected)
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const {
      city,
      keyword,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = {};

    if (city) {
      query.city = city;
    }

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { venue: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) query.dateTime.$gte = new Date(startDate);
      if (endDate) query.dateTime.$lte = new Date(endDate);
    }

    if (status) {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/events/:id
// @desc    Get single event details (protected)
router.get('/events/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/dashboard/events/:id/import
// @desc    Import event to platform (protected)
router.post('/events/:id/import', authenticateToken, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if already imported
    if (event.status === 'imported') {
      return res.status(400).json({
        success: false,
        message: 'Event already imported'
      });
    }

    // Update event with import info
    event.status = 'imported';
    event.importedAt = new Date();
    event.importedBy = req.user.email;
    if (notes) event.importNotes = notes;

    await event.save();

    res.json({
      success: true,
      message: 'Event imported successfully',
      event
    });
  } catch (error) {
    console.error('Error importing event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (protected)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { city } = req.query;
    const query = city ? { city } : {};

    const stats = await Event.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Event.countDocuments(query);

    const statsObj = {
      total,
      byStatus: {}
    };

    stats.forEach(stat => {
      statsObj.byStatus[stat._id] = stat.count;
    });

    res.json({
      success: true,
      stats: statsObj
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
