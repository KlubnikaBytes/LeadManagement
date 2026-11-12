const followUpService = require('../services/followup.service');

const createFollowUp = async (req, res, next) => {
  try {
    const followUp = await followUpService.createFollowUp(req.params.leadId, req.body, req.user._id);
    res.status(201).json({ success: true, data: followUp });
  } catch (err) {
    next(err);
  }
};

const getFollowUps = async (req, res, next) => {
  try {
    const result = await followUpService.getFollowUps(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const updateFollowUp = async (req, res, next) => {
  try {
    const followUp = await followUpService.updateFollowUp(req.params.id, req.body, req.user._id);
    res.json({ success: true, data: followUp });
  } catch (err) {
    next(err);
  }
};

module.exports = { createFollowUp, getFollowUps, updateFollowUp };
