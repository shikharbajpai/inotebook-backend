const { validationResult } = require('express-validator');
const logger = require('../services/logger');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Error: 400 - Validation error');
        return res.status(400).json({
            statusCode: 400,
            status: "failure",
            data: {},
            error: errors.array()
        });
    }
    next();
};

module.exports = handleValidationErrors;