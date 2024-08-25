const mongoose = require('mongoose');
const logger = require('./services/logger');
// Use environment variable for the MongoDB URI
const mongoURI = process.env.MONGO_URI;

const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI);
        logger.info('Connected to MongoDB successfully');
    } catch (error) {
        logger.error('Error connecting to MongoDB');
    }
};

module.exports = connectToMongo;
