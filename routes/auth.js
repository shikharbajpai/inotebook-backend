const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../services/logger');
const User = require('../models/userModel');
const validation = require('../middleware/validations');
const fetchuser = require('../middleware/fetchuser');

const router = express.Router();

// Validation rules for user creation
const userValidationRules = () => [
    body('name')
        .isString().withMessage('Name must be a string')
        .notEmpty().withMessage('Name is required')
        .trim()
        .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),

    body('email')
        .isEmail().withMessage('Invalid email format')
        .notEmpty().withMessage('Email is required')
        .normalizeEmail(),

    body('password')
        .isString().withMessage('Password must be a string')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// Validation rules for user login
const loginValidationRules = () => [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .notEmpty().withMessage('Email is required')
        .normalizeEmail(),

    body('password')
        .isString().withMessage('Password must be a string')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// const generateToken = (user) => jwt.sign(
//     { id: user._id, name: user.name, email: user.email },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRY || '60s' }
// );

// Function to generate JWT token
const generateToken = (user, expiresIn = '1h') => jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
);

// Create a user using: POST /api/auth/createuser
router.post('/createuser', userValidationRules(), validation, async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (await User.findOne({ email })) {
            logger.error('Error: 400 - Email is already in use');
            return res.status(400).json({
                statusCode: 400,
                status: "failure",
                data: {},
                error: {
                    code: 400,
                    name: "Bad Request",
                    message: "Email is already in use"
                }
            });
        }

        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        const token = generateToken(newUser);
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { token } }
        });
        logger.info('User created and token generated successfully');
    } catch (error) {
        logger.error('Error creating user:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

// Authenticate user and generate token using: POST /api/auth/login
router.post('/login', loginValidationRules(), validation, async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
            logger.error('Error: 400 - Incorrect email or password');
            return res.status(400).json({
                statusCode: 400,
                status: "failure",
                data: {},
                error: {
                    code: 400,
                    name: "Bad Request",
                    message: "Incorrect email or password"
                }
            });
        }

        const token = generateToken(existingUser);
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { token } }
        });
        logger.info('User logged in and token generated successfully');
    } catch (error) {
        logger.error('Error logging in user:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

// Fetch user details using: POST /api/auth/getuser
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({
                statusCode: 404,
                status: "failure",
                data: { records: { errors: [{ msg: 'User not found' }] } }
            });
        }
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { user } }
        });
        logger.info('User details fetched successfully');
    } catch (error) {
        logger.error('Error fetching user details:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

// Forgot Password: POST /api/auth/forgotpassword
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({
                statusCode: 404,
                status: "failure",
                data: {},
                error: {
                    code: 404,
                    name: "Not Found",
                    message: "User not found"
                }
            });
        }

        const resetToken = generateToken(user, '5m');

        // Here, you would normally send this token to the user via email
        // For simplicity, we're returning it in the response
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { resetToken } }
        });

        logger.info('Password reset token generated successfully');
    } catch (error) {
        logger.error('Error in forgot password:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

// Reset Password: POST /api/auth/resetpassword
router.post('/resetpassword', fetchuser, async (req, res) => {
    const { newPassword } = req.body;

    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                statusCode: 404,
                status: "failure",
                data: {},
                error: {
                    code: 404,
                    name: "Not Found",
                    message: "User not found"
                }
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { message: 'Password reset successfully' } }
        });
        logger.info('Password reset successfully');
    } catch (error) {
        logger.error('Error in reset password:', error.message);
        res.status(400).json({
            statusCode: 400,
            status: "failure",
            data: { records: { errors: [{ msg: 'Invalid or expired token' }] } }
        });
    }
});


module.exports = router;
