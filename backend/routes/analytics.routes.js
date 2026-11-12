const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getDashboard, getLeadsAnalytics, getCallsAnalytics, getTeamAnalytics } = require('../controllers/analytics.controller');

router.use(protect);
router.get('/dashboard', getDashboard);
router.get('/leads', getLeadsAnalytics);
router.get('/calls', getCallsAnalytics);
router.get('/team', getTeamAnalytics);

module.exports = router;
