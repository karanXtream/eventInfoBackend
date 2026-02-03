const getEventUrls = require('./list');
const scrapeDetail = require('./detail');

async function scrapeEvents() {
  const urls = await getEventUrls();
  const events = [];

  for (const url of urls.slice(0, 10)) { // LIMIT FOR MVP
    try {
      const event = await scrapeDetail(url);
      if (event.title) events.push(event);
    } catch (err) {
      console.error('CityOfSydney error:', url);
    }
  }

  return events;
}

module.exports = { scrapeEvents };
