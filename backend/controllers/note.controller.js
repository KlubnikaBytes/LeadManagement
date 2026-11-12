const Note = require('../models/Note.model');
const { createActivity } = require('../utils/helpers');

const addNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Note text is required' });

    const note = await Note.create({
      lead: req.params.leadId,
      createdBy: req.user._id,
      text,
    });

    await createActivity({
      lead: req.params.leadId,
      user: req.user._id,
      type: 'NOTE_ADDED',
      description: `Note added`,
      metadata: { noteId: note._id, preview: text.substring(0, 100) },
    });

    await note.populate('createdBy', 'name email avatar');
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
};

const getNotesByLead = async (req, res, next) => {
  try {
    const notes = await Note.find({ lead: req.params.leadId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
};

module.exports = { addNote, getNotesByLead };
