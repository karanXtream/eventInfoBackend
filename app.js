const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:5173',
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
