const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeDetail(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const title = $('h1').first().text().trim();

  const description = $('[data-testid="event-description"]')
    .text()
    .trim() ||
    $('meta[name="description"]').attr('content') ||
    '';

let dateText =
  $('time[datetime]').attr('datetime') ||
  $('[data-testid*="date"]').text().trim() ||
  $('.event-date').text().trim();

let dateTime = null;

if (dateText) {
  const parsedDate = new Date(dateText);
  if (!isNaN(parsedDate.getTime())) {
    dateTime = parsedDate;
  }
}

  const venue = $('[data-testid="event-location"]')
    .find('h3')
    .text()
    .trim();

  const address = $('[data-testid="event-location"]')
    .find('p')
    .text()
    .trim();

  const imageUrl =
    $('meta[property="og:image"]').attr('content') || null;

  return {
    title,
    description,
    dateTime,
    venue,
    address,
    city: 'Sydney',
    category: ['city-event'],
    imageUrl,
    source: {
      name: 'CityOfSydney',
      eventUrl: url
    }
  };
};
