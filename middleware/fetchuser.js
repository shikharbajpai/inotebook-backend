const jwt = require('jsonwebtoken');
const logger = require('../services/logger');

const fetchuser = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        logger.error('Authentication token missing');
        return res.status(401).json({
            statusCode: 401,
            status: "failure",
            data: {
                redirectUrl: ''
            },
            error: {
                code: 401,
                name: "AuthenticationError",
                message: "Authentication token is missing. Please log in."
            }
        });
    }

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = data.id;
        next();
    } catch (error) {
        logger.error(`Invalid token: ${error.message}`);
        res.status(401).json({
            statusCode: 401,
            status: "failure",
            data: {
                redirectUrl: ''
            },
            error: {
                code: 401,
                name: "AuthenticationError",
                message: "Invalid token. Please log in again."
            }
        });
    }
};

module.exports = fetchuser;
