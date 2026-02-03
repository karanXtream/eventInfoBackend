const getEventUrls = require('./list');
const scrapeDetail = require('./detail');

async function scrapeEvents() {
  const urls = await getEventUrls();
  const events = [];

  for (const url of urls.slice(0, 10)) { // LIMIT for MVP
    try {
      const event = await scrapeDetail(url);
      events.push(event);
    } catch (e) {
      console.error('Eventbrite error:', url);
    }
  }
  return events;
}

module.exports = { scrapeEvents };
