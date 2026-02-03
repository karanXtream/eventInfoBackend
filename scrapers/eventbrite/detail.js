const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeDetail(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const dateText = $('time').attr('datetime');
  let dateTime = null;
  if (dateText) {
    const parsedDate = new Date(dateText);
    if (!isNaN(parsedDate.getTime())) {
      dateTime = parsedDate;
    }
  }

  return {
    title: $('h1').first().text().trim(),
    description: $('meta[name="description"]').attr('content'),
    dateTime,
    venue: $('[data-testid="venue-name"]').text().trim(),
    address: $('[data-testid="venue-address"]').text().trim(),
    imageUrl: $('img').first().attr('src'),
    source: {
      name: 'Eventbrite',
      eventUrl: url
    }
  };
};
