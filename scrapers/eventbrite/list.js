const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function getEventUrls() {
  const { data } = await axios.get(
    'https://www.eventbrite.com.au/d/australia--sydney/events/'
  );
  const $ = cheerio.load(data);

  const urls = [];
  $('a[href*="/e/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) urls.push(href.split('?')[0]);
  });

  return [...new Set(urls)];
};
