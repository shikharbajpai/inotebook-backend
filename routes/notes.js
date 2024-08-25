const express = require('express');
const { body } = require('express-validator');
const logger = require('../services/logger');
const Notes = require('../models/notesModel');
const fetchuser = require('../middleware/fetchuser');
const validation = require('../middleware/validations');

const router = express.Router();

// Validation rules for note creation
const notesValidationRules = () => [
    body('title')
        .isString().withMessage('Title must be a string')
        .notEmpty().withMessage('Title is required')
        .trim(),

    body('description')
        .isString().withMessage('Description must be a string')
        .notEmpty().withMessage('Description is required')
        .trim(),

    body('tag')
        .isString().withMessage('Tag must be a string')
];

// Validation rules for note updates
const updateNotesValidationRules = () => [
    // Check that title is a string if provided
    body('title')
        .optional()
        .isString().withMessage('Title must be a string')
        .trim(),

    // Check that description is a string if provided
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),

    // Check that tag is a string if provided
    body('tag')
        .optional()
        .isString().withMessage('Tag must be a string')
];

// Fetch all notes for the logged-in user using GET /api/notes/fetchallnotes
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    const userId = req.userId;
    try {
        const notes = await Notes.find({ user: userId });
        if (notes.length === 0) {
            logger.info('No notes found');
            return res.status(200).json({
                statusCode: 200,
                status: "success",
                data: { records: { notes: [], msg: 'No notes found' } }
            });
        }
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { notes } }
        });
        logger.info('Note(s) fetched successfully');
    } catch (error) {
        logger.error('Error fetching notes:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

// Adding note(s) for the logged-in user using POST /api/notes/addnote
router.post('/addnote', fetchuser, notesValidationRules(), validation, async (req, res) => {
    const userId = req.userId;
    const { title, description, tag } = req.body;
    try {
        const notes = new Notes({ user: userId, title, description, tag });
        await notes.save();
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { notes } }
        });
        logger.info('Note created successfully');
    } catch (error) {
        logger.error('Error creating note:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

// Update existing note for the logged-in user using PUT /api/notes/updatenote/:id
router.put('/updatenote/:id', fetchuser, updateNotesValidationRules(), validation, async (req, res) => {
    const userId = req.userId;
    const { title, description, tag } = req.body;
    try {
        // Construct the update object
        const updateFields = {};
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
        if (tag) updateFields.tag = tag;

        // Find the note to be updated
        let note = await Notes.findById(req.params.id);
        if (!note) {
            logger.error('Note not found');
            return res.status(404).json({
                statusCode: 404,
                status: "failure",
                data: { records: { errors: [{ msg: 'Note not found' }] } }
            });
        }

        // Match the logged-in user and the note owner
        if (note.user.toString() !== userId) {
            logger.error('Authentication error. Please log in again.');
            return res.status(401).json({
                statusCode: 401,
                status: "failure",
                data: {
                    redirectUrl: '',
                    error: {
                        code: 401,
                        name: "AuthenticationError",
                        message: "Authentication error. Please log in again."
                    }
                }
            });
        }

        // Update the note
        note = await Notes.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { note } }
        });
        logger.info('Note updated successfully');
    } catch (error) {
        logger.error('Error updating note:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

// Delete existing note for the logged-in user using DELETE /api/notes/deletenote/:id
router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    const userId = req.userId;
    try {
        // Find the note to be deleted
        let note = await Notes.findById(req.params.id);
        if (!note) {
            logger.error('Note not found');
            return res.status(404).json({
                statusCode: 404,
                status: "failure",
                data: { records: { errors: [{ msg: 'Note not found' }] } }
            });
        }

        // Match the logged-in user and the note owner
        if (note.user.toString() !== userId) {
            logger.error('Authentication error. Please log in again.');
            return res.status(401).json({
                statusCode: 401,
                status: "failure",
                data: {
                    redirectUrl: '',
                    error: {
                        code: 401,
                        name: "AuthenticationError",
                        message: "Authentication error. Please log in again."
                    }
                }
            });
        }

        // Delete the note
        await Notes.findByIdAndDelete(req.params.id);
        res.status(200).json({
            statusCode: 200,
            status: "success",
            data: { records: { msg: "Note has been deleted successfully" } }
        });
        logger.info('Note deleted successfully');
    } catch (error) {
        logger.error('Error deleting note:', error.message);
        res.status(500).json({
            statusCode: 500,
            status: "failure",
            data: { records: { errors: [{ msg: 'Internal server error' }] } }
        });
    }
});

module.exports = router;
