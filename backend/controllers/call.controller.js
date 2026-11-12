const callService = require('../services/call.service');

const logCall = async (req, res, next) => {
  try {
    const call = await callService.logCall(req.params.leadId, req.body, req.user._id);
    res.status(201).json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
};

const getCallsByLead = async (req, res, next) => {
  try {
    const calls = await callService.getCallsByLead(req.params.leadId, req.user);
    res.json({ success: true, data: calls });
  } catch (err) {
    next(err);
  }
};

const getAllCalls = async (req, res, next) => {
  try {
    const result = await callService.getAllCalls(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { logCall, getCallsByLead, getAllCalls };
