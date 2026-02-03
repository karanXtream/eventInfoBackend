const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const app = express();

// Enable CORS for frontend (both local and production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/scrape', require('./routes/scrape.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/ticket-requests', require('./routes/ticketRequest.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

module.exports = app;
