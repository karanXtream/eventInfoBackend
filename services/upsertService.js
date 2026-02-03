const Event = require('../models/Event');
const generateHash = require('./hashService');

async function upsertEvents(events, sourceName) {
  let inserted = 0;
  let updated = 0;

  for (const event of events) {
    // Skip events without valid required fields
    if (!event.title || !event.source?.eventUrl) {
      console.log('Skipping invalid event:', event.title || 'No title');
      continue;
    }

    // Remove null dateTime to avoid validation errors
    const eventData = { ...event };
    if (eventData.dateTime === null) {
      delete eventData.dateTime;
    }

    const hash = generateHash(eventData);

    const existing = await Event.findOne({
      'source.eventUrl': eventData.source.eventUrl
    });

    if (!existing) {
      await Event.create({
        ...eventData,
        hash,
        status: 'new',
        lastScrapedAt: new Date()
      });
      inserted++;
    } else if (existing.hash !== hash) {
      await Event.updateOne(
        { _id: existing._id },
        {
          ...eventData,
          hash,
          status: 'updated',
          lastScrapedAt: new Date()
        }
      );
      updated++;
    } else {
      await Event.updateOne(
        { _id: existing._id },
        { lastScrapedAt: new Date() }
      );
    }
  }

  return { 
    inserted, 
    updated, 
    skipped: events.length - inserted - updated 
  };
}

/**
 * Mark events as inactive based on multiple criteria:
 * 1. Events not scraped recently (removed from source website)
 * 2. Events with past dates (already happened)
 * 3. Events too far in the future (likely errors)
 * 
 * @param {Number} hours - Hours since last scrape to consider removed (default: 24)
 * @returns {Object} - Breakdown of inactive events by reason
 */
async function markInactiveEvents(hours = 24) {
  const now = new Date();
  const scrapeThreshold = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const pastDateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const futureDateThreshold = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year ahead

  // 1. Mark events not scraped recently (removed from source)
  const notScrapedRecently = await Event.updateMany(
    {
      lastScrapedAt: { $lt: scrapeThreshold },
      status: { $ne: 'inactive' }
    },
    {
      status: 'inactive',
      inactiveReason: 'Not found in recent scrapes'
    }
  );

  // 2. Mark events with past dates (already happened)
  const pastEvents = await Event.updateMany(
    {
      dateTime: { $lt: pastDateThreshold },
      status: { $ne: 'inactive' }
    },
    {
      status: 'inactive',
      inactiveReason: 'Event date has passed'
    }
  );

  // 3. Mark events with suspicious future dates (likely data errors)
  const farFutureEvents = await Event.updateMany(
    {
      dateTime: { $gt: futureDateThreshold },
      status: { $ne: 'inactive' }
    },
    {
      status: 'inactive',
      inactiveReason: 'Event date too far in future'
    }
  );

  return {
    total: notScrapedRecently.modifiedCount + pastEvents.modifiedCount + farFutureEvents.modifiedCount,
    notScraped: notScrapedRecently.modifiedCount,
    pastDates: pastEvents.modifiedCount,
    farFuture: farFutureEvents.modifiedCount
  };
}

module.exports = { upsertEvents, markInactiveEvents };
