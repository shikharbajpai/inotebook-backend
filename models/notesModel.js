const mongoose = require('mongoose');
const { Schema } = mongoose;

const notesSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true, // Remove leading and trailing whitespace
    },
    description: {
        type: String,
        required: true,
        trim: true, // Remove leading and trailing whitespace
    },
    tag: {
        type: String,
        default: "General",
        trim: true, // Remove leading and trailing whitespace
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Note', notesSchema);
