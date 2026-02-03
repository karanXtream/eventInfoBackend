# Automatic Data Update System

## 🔄 How Our Website Updates Data

Our system automatically keeps event data synchronized with the source websites (Eventbrite and City of Sydney) using a smart update mechanism.

---

## 📋 Overview

### The System Has 3 Main Components:

1. **Cron Job Scheduler** (`jobs/scraperCron.js`)
   - Runs automatically every 6 hours
   - Scrapes latest data from all sources
   - No manual intervention needed

2. **Hash-Based Change Detection** (`services/hashService.js`)
   - Creates a unique fingerprint for each event
   - Detects when content changes (title, date, venue, etc.)
   - Only updates when actual changes occur

3. **Smart Upsert Service** (`services/upsertService.js`)
   - Insert new events
   - Update changed events
   - Mark missing events as inactive

---

## ⚙️ How It Works (Step by Step)

### Step 1: Scheduled Scraping
```
Every 6 hours (00:00, 06:00, 12:00, 18:00):
├── Scrape Eventbrite
├── Scrape City of Sydney
└── Process all events
```

### Step 2: Event Processing

For **each scraped event**, the system:

```javascript
1. Check if event URL exists in database
   │
   ├─ NO (New Event)
   │   ├─ Generate hash from content
   │   ├─ Save to database
   │   ├─ Mark as "new"
   │   └─ Set lastScrapedAt to now
   │
   └─ YES (Existing Event)
       ├─ Generate hash from new content
       ├─ Compare with stored hash
       │
       ├─ Hashes Different (Content Changed)
       │   ├─ Update all fields
       │   ├─ Mark as "updated"
       │   └─ Set lastScrapedAt to now
       │
       └─ Hashes Same (No Change)
           └─ Only update lastScrapedAt
```

### Step 3: Cleanup Inactive Events

```javascript
After processing all events:
├─ Find events not scraped in last 24 hours
├─ Mark them as "inactive"
└─ (They may have been removed from source website)
```

---

## 🔐 Hash Generation (Change Detection)

### What is a Hash?
A hash is like a fingerprint for event data. If any important field changes, the hash changes.

### Fields Monitored for Changes:
- ✅ Title
- ✅ Description
- ✅ Date/Time
- ✅ Venue
- ✅ Address
- ✅ Image URL

### Example:
```javascript
Event A (First scrape):
{
  title: "Sydney Music Festival",
  venue: "Opera House",
  dateTime: "2026-03-15"
}
Hash: "a1b2c3d4e5f6..."

Event A (Second scrape - venue changed):
{
  title: "Sydney Music Festival",
  venue: "Town Hall",  // CHANGED
  dateTime: "2026-03-15"
}
Hash: "x9y8z7w6v5u4..."  // DIFFERENT HASH

System detects change → Updates database
```

---

## 📊 Event Status Lifecycle

```
new → updated → inactive
 │      │         │
 │      │         └─ Not found in recent scrapes
 │      └─ Content changed from original
 └─ First time scraped
```

---

## 🕐 Cron Schedule Configuration

### Current Schedule: Every 6 Hours
```javascript
cron.schedule('0 */6 * * *', ...)
```

### Other Options:

| Schedule | Cron Expression | When It Runs |
|----------|----------------|--------------|
| Every hour | `'0 * * * *'` | :00 of every hour |
| Every 3 hours | `'0 */3 * * *'` | 00:00, 03:00, 06:00... |
| Every 12 hours | `'0 */12 * * *'` | 00:00, 12:00 |
| Daily at midnight | `'0 0 * * *'` | 00:00 every day |
| Every 5 minutes | `'*/5 * * * *'` | Good for testing |

### To Change Schedule:
Edit `backend/jobs/scraperCron.js` line 24:
```javascript
cron.schedule('YOUR_SCHEDULE_HERE', async () => {
  // ...
})
```

---

## 🧪 Testing the Update System

### Method 1: Manual API Call
```bash
POST http://localhost:5000/api/scrape/all
```

### Method 2: Temporary Fast Schedule
Change cron to run every minute for testing:
```javascript
cron.schedule('* * * * *', async () => {
  // Runs every minute
})
```

---

## 📈 Monitoring Updates

### Console Logs Show:
```
🕐 Running scheduled scrape at: 2/2/2026, 12:00:00 PM
📥 Eventbrite: Found 25 events
✅ Eventbrite: Inserted 3, Updated 2
📥 City of Sydney: Found 18 events
✅ City of Sydney: Inserted 1, Updated 5
🗑️  Marked 4 events as inactive
✨ Scrape complete: 4 new, 7 updated, 4 inactive
```

### Database Tracking:
Each event has:
- `lastScrapedAt` - When it was last found
- `status` - Current state (new/updated/inactive)
- `hash` - Content fingerprint
- `createdAt` - First time added
- `updatedAt` - Last modification

---

## 🔧 Files Involved

```
backend/
├── jobs/
│   └── scraperCron.js          # Automated scheduling
├── services/
│   ├── hashService.js          # Change detection
│   ├── upsertService.js        # Insert/Update logic
│   └── scrapeContext.js        # Browser management
├── scrapers/
│   ├── eventbrite/
│   │   ├── list.js             # Get event URLs
│   │   ├── detail.js           # Scrape event details
│   │   └── index.js            # Main scraper
│   └── cityofsydney/
│       ├── list.js
│       ├── detail.js
│       └── index.js
└── models/
    └── Event.js                # Database schema
```

---

## 🎯 Key Benefits

1. **Automatic Updates** - No manual work needed
2. **Smart Detection** - Only updates when content actually changes
3. **Data Integrity** - Tracks event history and status
4. **Performance** - Doesn't re-save identical data
5. **Monitoring** - Clear logs of all changes
6. **Cleanup** - Automatically identifies removed events

---

## 🚀 Starting the System

The cron job starts automatically when you run:
```bash
npm start
# or
npm run dev
```

You'll see:
```
⏰ Cron job scheduled: Event scraping every 6 hours
Server running on port 5000
MongoDB connected
```

The system is now monitoring and will update automatically!
