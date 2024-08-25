const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true, // Remove leading and trailing whitespace
        minlength: 2, // Example constraint: minimum length
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure email is unique
        trim: true, // Remove leading and trailing whitespace
        lowercase: true, // Convert to lowercase
        match: /.+\@.+\..+/ // Simple regex pattern to validate email format
    },
    password: {
        type: String,
        required: true,
        minlength: 6, // Example constraint: minimum length for security
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
