const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getLeads, getOptions, addOption, getLead, createLead, updateLead, deleteLead,
  changeStatus, assignLead, checkDuplicate, importLeads, exportLeads,
} = require('../controllers/lead.controller');
const { logCall, getCallsByLead } = require('../controllers/call.controller');
const { createFollowUp } = require('../controllers/followup.controller');
const { addNote, getNotesByLead } = require('../controllers/note.controller');
const { getActivitiesByLead } = require('../controllers/activity.controller');

router.use(protect);

router.get('/options', getOptions);
router.post('/options', authorize('ADMIN'), addOption);
router.get('/check-duplicate', checkDuplicate);
router.get('/export', exportLeads);
router.post('/import', authorize('ADMIN', 'TEAM_LEADER'), upload.single('file'), importLeads);

router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLead)
  .put(updateLead)
  .delete(authorize('ADMIN'), deleteLead);

router.patch('/:id/status', changeStatus);
router.patch('/:id/assign', authorize('ADMIN', 'TEAM_LEADER'), assignLead);

router.post('/:leadId/calls', logCall);
router.get('/:leadId/calls', getCallsByLead);

router.post('/:leadId/followups', createFollowUp);

router.post('/:leadId/notes', addNote);
router.get('/:leadId/notes', getNotesByLead);

router.get('/:leadId/activities', getActivitiesByLead);

module.exports = router;
