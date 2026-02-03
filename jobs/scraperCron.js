const cron = require('node-cron');
const eventbrite = require('../scrapers/eventbrite');
const cityofsydney = require('../scrapers/cityofsydney');
const { upsertEvents } = require('../services/upsertService');
const { markInactiveEvents } = require('../services/upsertService');

/**
 * Automatic Data Update System
 * 
 * Schedule: Runs every 6 hours (at 00:00, 06:00, 12:00, 18:00)
 * 
 * How it works:
 * 1. Scrapes latest data from Eventbrite and City of Sydney
 * 2. For each event:
 *    - Generates a hash from event content (title, date, venue, etc.)
 *    - Compares with existing events by URL
 *    - If new URL -> Insert as new event
 *    - If URL exists but hash changed -> Update event with new data
 *    - If URL exists and hash same -> Just update lastScrapedAt timestamp
 * 3. Marks events as inactive if not found in recent scrapes
 */

// Run every 6 hours: '0 */6 * * *'
// For testing every minute: '* * * * *'
// For testing every 5 minutes: '*/5 * * * *'
cron.schedule('0 */6 * * *', async () => {
  console.log('🕐 Running scheduled scrape at:', new Date().toLocaleString());
  
  try {
    // Scrape from all sources
    const results = await Promise.allSettled([
      eventbrite.scrapeEvents(),
      cityofsydney.scrapeEvents()
    ]);

    let totalInserted = 0;
    let totalUpdated = 0;

    // Process Eventbrite results
    if (results[0].status === 'fulfilled') {
      console.log(`📥 Eventbrite: Found ${results[0].value.length} events`);
      const summary = await upsertEvents(results[0].value, 'Eventbrite');
      console.log(`✅ Eventbrite: Inserted ${summary.inserted}, Updated ${summary.updated}`);
      totalInserted += summary.inserted;
      totalUpdated += summary.updated;
    } else {
      console.error('❌ Eventbrite scrape failed:', results[0].reason);
    }

    // Process City of Sydney results
    if (results[1].status === 'fulfilled') {
      console.log(`📥 City of Sydney: Found ${results[1].value.length} events`);
      const summary = await upsertEvents(results[1].value, 'CityOfSydney');
      console.log(`✅ City of Sydney: Inserted ${summary.inserted}, Updated ${summary.updated}`);
      totalInserted += summary.inserted;
      totalUpdated += summary.updated;
    } else {
      console.error('❌ City of Sydney scrape failed:', results[1].reason);
    }

    // Mark events as inactive based on multiple criteria
    const inactiveResults = await markInactiveEvents(24);
    console.log(`🗑️  Inactive events: ${inactiveResults.total} total`);
    console.log(`   - Not scraped: ${inactiveResults.notScraped}`);
    console.log(`   - Past dates: ${inactiveResults.pastDates}`);
    console.log(`   - Far future: ${inactiveResults.farFuture}`);

    console.log(`✨ Scrape complete: ${totalInserted} new, ${totalUpdated} updated, ${inactiveResults.total} inactive`);
    
  } catch (error) {
    console.error('❌ Scheduled scrape error:', error);
  }
});

console.log('⏰ Cron job scheduled: Event scraping every 6 hours');
