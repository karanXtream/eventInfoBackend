// services/scrapeContext.js
function getScrapeContext() {
  return {
    startedAt: new Date(),
    seenUrls: new Set()
  };
}

module.exports = { getScrapeContext };
