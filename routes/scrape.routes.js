const express = require('express');
const router = express.Router();

const eventbrite = require('../scrapers/eventbrite');
const cityofsydney = require('../scrapers/cityofsydney');
const { upsertEvents } = require('../services/upsertService');

router.post('/all', async (req, res) => {
  const results = await Promise.allSettled([
    eventbrite.scrapeEvents(),
    cityofsydney.scrapeEvents()
  ]);

  let summary = [];

  if (results[0].status === 'fulfilled') {
    summary.push(await upsertEvents(results[0].value, 'Eventbrite'));
  }
  if (results[1].status === 'fulfilled') {
    summary.push(await upsertEvents(results[1].value, 'CityOfSydney'));
  }

  res.json({ message: 'Scrape done', summary });
});

module.exports = router;
