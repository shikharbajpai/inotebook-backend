require('dotenv').config();
const connectToMongo = require('./db');
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const authRoute = require('./routes/auth');
const notesRoute = require('./routes/notes');
const logger = require('./services/logger');

// Connect to MongoDB
connectToMongo();

// Middleware - To use req.body
app.use(express.json());

// Middleware - Enable CORS policy
app.use(cors());

// Define routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Other routes
app.use('/api/auth', authRoute);
app.use('/api/notes', notesRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack); // Use Winston to log errors
  res.status(500).json({ error: 'Internal server error' }); // Provide JSON error response
});

// Start the server
app.listen(port, () => {
  logger.info(`Node Server is started and Listening on port ${port}`);
});
