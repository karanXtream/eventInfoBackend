# ✅ Automatic Event Update System - Complete Implementation

## 🎯 Requirements & Implementation Status

### ✅ 1. Detect New Events

**How it works:**
- Every 6 hours, scrapers fetch latest events from source websites
- System checks if event URL exists in database
- If **URL is new** → Insert as new event with status: `'new'`

**Code Location:** `services/upsertService.js` (lines 27-33)
```javascript
if (!existing) {
  await Event.create({
    ...eventData,
    hash,
    status: 'new',        // ← Marked as NEW
    lastScrapedAt: new Date()
  });
  inserted++;
}
```

**Example:**
```
Eventbrite publishes: "Summer Jazz Festival"
Our System: Event URL not found → INSERT as NEW
Status: "new" ✨
```

---

### ✅ 2. Detect Updated Events (Changed Time/Venue/Details)

**How it works:**
- System generates a **hash** (unique fingerprint) from event content
- Hash includes: title, description, dateTime, venue, address, imageUrl
- Compares new hash with stored hash
- If **hashes differ** → Event was updated on source site

**Code Location:** 
- Hash generation: `services/hashService.js`
- Update detection: `services/upsertService.js` (lines 34-43)

```javascript
else if (existing.hash !== hash) {
  await Event.updateOne(
    { _id: existing._id },
    {
      ...eventData,
      hash,                 // New hash
      status: 'updated',    // ← Marked as UPDATED
      lastScrapedAt: new Date()
    }
  );
  updated++;
}
```

**Example:**
```
Original:  
  Title: "Sydney Festival"
  Venue: "Opera House"
  Hash: "abc123..."

Updated on Source:
  Title: "Sydney Festival"  
  Venue: "Town Hall" ← CHANGED
  Hash: "xyz789..." ← Different!

Our System: Hash mismatch → UPDATE event
Status: "updated" 🔄
```

**Fields Monitored for Changes:**
- ✅ Title
- ✅ Description  
- ✅ Date/Time
- ✅ Venue
- ✅ Address
- ✅ Image URL

---

### ✅ 3. Detect Inactive Events (No Longer Available / Removed / Past)

**How it works:**
System marks events as inactive based on **3 criteria**:

#### A. Events Removed from Source Website
- If event wasn't found in last scrape (24 hours)
- Likely removed from source site

#### B. Events with Past Dates  
- Events that already happened (> 1 day ago)
- Automatically marked inactive

#### C. Events with Suspicious Future Dates
- Events more than 1 year in future
- Likely data errors or placeholders

**Code Location:** `services/upsertService.js` (lines 62-106)

```javascript
// 1. Not scraped recently (removed from source)
const notScrapedRecently = await Event.updateMany(
  {
    lastScrapedAt: { $lt: scrapeThreshold },  // Not found in 24h
    status: { $ne: 'inactive' }
  },
  {
    status: 'inactive',
    inactiveReason: 'Not found in recent scrapes'
  }
);

// 2. Past dates (already happened)
const pastEvents = await Event.updateMany(
  {
    dateTime: { $lt: pastDateThreshold },     // > 1 day ago
    status: { $ne: 'inactive' }
  },
  {
    status: 'inactive',
    inactiveReason: 'Event date has passed'
  }
);

// 3. Far future dates (likely errors)
const farFutureEvents = await Event.updateMany(
  {
    dateTime: { $gt: futureDateThreshold },   // > 1 year ahead
    status: { $ne: 'inactive' }
  },
  {
    status: 'inactive',
    inactiveReason: 'Event date too far in future'
  }
);
```

**Example Scenarios:**

**Scenario 1: Removed from Source**
```
Day 1: Event scraped successfully
       lastScrapedAt: 2026-02-02 10:00

Day 2: Event not found on source website
       lastScrapedAt: Still 2026-02-02 10:00 (24h+ old)
       
Our System: Not scraped recently → INACTIVE
Status: "inactive" ❌
Reason: "Not found in recent scrapes"
```

**Scenario 2: Past Event**
```
Event: "New Year Party 2026"
Date: 2026-01-01
Today: 2026-02-02

Our System: Date is past → INACTIVE
Status: "inactive" ❌
Reason: "Event date has passed"
```

**Scenario 3: Suspicious Future Date**
```
Event: "Future Conference"
Date: 2028-12-31 (2+ years away)
Today: 2026-02-02

Our System: Too far in future → INACTIVE
Status: "inactive" ❌
Reason: "Event date too far in future"
```

---

## 🔄 Complete Update Flow

```
┌─────────────────────────────────────────────────────────────┐
│  EVERY 6 HOURS (Cron Job)                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. SCRAPE                                                   │
│     - Eventbrite: Get all event URLs & details              │
│     - City of Sydney: Get all event URLs & details          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. PROCESS EACH EVENT                                       │
│                                                              │
│     Check: Does event URL exist in database?                │
│        │                                                     │
│        ├─ NO  → ✨ INSERT as NEW                            │
│        │         status: "new"                               │
│        │                                                     │
│        └─ YES → Generate hash from content                  │
│                 Compare with stored hash                     │
│                    │                                         │
│                    ├─ Different → 🔄 UPDATE                 │
│                    │               status: "updated"         │
│                    │                                         │
│                    └─ Same → ⏰ Update lastScrapedAt only   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. MARK INACTIVE EVENTS                                     │
│                                                              │
│     Check: lastScrapedAt > 24 hours ago?                    │
│        → ❌ INACTIVE (removed from source)                  │
│                                                              │
│     Check: dateTime < yesterday?                            │
│        → ❌ INACTIVE (event passed)                         │
│                                                              │
│     Check: dateTime > 1 year ahead?                         │
│        → ❌ INACTIVE (suspicious date)                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. LOG RESULTS                                              │
│     ✨ X new events                                         │
│     🔄 X updated events                                     │
│     ❌ X inactive events                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Event Status Lifecycle

```
NEW → UPDATED → INACTIVE
 │       │          │
 │       │          └─ Removed / Past / Error
 │       └─ Content changed
 └─ First time scraped
```

---

## 🔌 API Endpoints

### For Frontend to Fetch Events

**GET** `/api/events`
- Returns active events (status: new or updated)
- Filters: source, keyword, date range
```bash
GET /api/events?status=new,updated&limit=50
```

**GET** `/api/events/stats`
- Event statistics (by status, by source)
```bash
GET /api/events/stats
```

**POST** `/api/scrape/all`
- Manually trigger scraping (for testing)
```bash
POST /api/scrape/all
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `jobs/scraperCron.js` | Automatic scheduling (every 6h) |
| `services/upsertService.js` | Insert/Update/Inactive logic |
| `services/hashService.js` | Change detection via hash |
| `scrapers/eventbrite/` | Eventbrite scraper |
| `scrapers/cityofsydney/` | City of Sydney scraper |
| `models/Event.js` | Database schema |
| `routes/events.routes.js` | API endpoints |

---

## 🎯 Summary

✅ **Requirement 1: Detect New Events**
   - ✓ New URL → Insert with status "new"

✅ **Requirement 2: Detect Updated Events**
   - ✓ Hash comparison detects content changes
   - ✓ Tracks: title, date, venue, address, description, image

✅ **Requirement 3: Detect Inactive Events**
   - ✓ Removed from source (not scraped in 24h)
   - ✓ Past event dates (already happened)
   - ✓ Suspicious future dates (errors)
   - ✓ Stores reason for inactivity

**System runs automatically every 6 hours with zero manual intervention!**
