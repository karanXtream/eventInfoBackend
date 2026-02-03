const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://whatson.cityofsydney.nsw.gov.au';

module.exports = async function getEventUrls() {
  const { data } = await axios.get(BASE_URL);
  const $ = cheerio.load(data);

  const urls = new Set();

  // Event cards → links
  $('a[href^="/events/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      urls.add(BASE_URL + href);
    }
  });

  return Array.from(urls);
};
