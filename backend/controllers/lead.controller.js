const leadService = require('../services/lead.service');
const Note = require('../models/Note.model');
const { createActivity } = require('../utils/helpers');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { processImport } = require('../services/import.service');

const getLeads = async (req, res, next) => {
  try {
    const result = await leadService.getLeads(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getOptions = async (req, res, next) => {
  try {
    const Lead = require('../models/Lead.model');
    const [sources, businessTypes, businessCategories, services, statuses, reachTypes] = await Promise.all([
      Lead.distinct('source'),
      Lead.distinct('businessType'),
      Lead.distinct('businessCategory'),
      Lead.distinct('interestedIn'),
      Lead.distinct('status'),
      Lead.distinct('typeOfReach'),
    ]);
    res.json({
      success: true,
      data: {
        sources,
        businessTypes,
        businessCategories,
        services,
        statuses,
        reachTypes,
      }
    });
  } catch (err) {
    next(err);
  }
};

const getLead = async (req, res, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id, req.user);
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

const createLead = async (req, res, next) => {
  try {
    const { lead, duplicate } = await leadService.createLead(req.body, req.user);
    req.app.get('io')?.emit('lead_updated');
    res.status(201).json({ success: true, data: lead, duplicate: duplicate || null });
  } catch (err) {
    next(err);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await leadService.updateLead(req.params.id, req.body, req.user._id, req.user.role);
    req.app.get('io')?.emit('lead_updated');
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    await leadService.deleteLead(req.params.id, req.user._id);
    req.app.get('io')?.emit('lead_updated');
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const { status, ...extra } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });
    const lead = await leadService.changeLeadStatus(req.params.id, status, req.user._id, extra);
    req.app.get('io')?.emit('lead_updated');
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

const assignLead = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ success: false, message: 'assignedTo is required' });
    const lead = await leadService.assignLead(req.params.id, assignedTo, req.user._id);
    req.app.get('io')?.emit('lead_updated');
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

const checkDuplicate = async (req, res, next) => {
  try {
    const { phone, email, website } = req.query;
    const duplicate = await leadService.checkDuplicate(phone, email, website);
    res.json({ success: true, duplicate: duplicate || null });
  } catch (err) {
    next(err);
  }
};

const importLeads = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    let records = [];
    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;
    const originalName = req.file.originalname.toLowerCase();

    if (originalName.endsWith('.csv')) {
      const content = fileBuffer.toString('utf-8');
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const record = {};
        headers.forEach((h, idx) => { record[h] = values[idx] || ''; });
        records.push(record);
      }
    } else {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(sheet);
    }

    const assignedTo = req.body.assignedTo || null;
    const result = await processImport(records, req.user._id, assignedTo);
    req.app.get('io')?.emit('lead_updated');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const EXPORT_HEADERS = [
  // 1. Prospective Business Info
  'Company Name',
  'Business Category',
  'Sub Category',
  'Website',
  'Address',
  'City',
  'State',
  'Country',
  'Pincode',
  'Business Description',
  // 2. POC Details
  'POC Name',
  'POC Job Title',
  'POC Phone',
  'POC Alt Phone',
  'POC Email',
  'POC LinkedIn',
  'POC Talk Notes',
  // 3. Type of Reach
  'Type of Reach',
  'Reach Notes',
  // 4. Sales & Ownership Details
  'Status',
  'Priority',
  'Added By',
  'Assigned To',
  'Interested In',
  'Estimated Budget',
  'Total Calls',
  'General Notes',
  'Last Contacted',
  'Next Follow-up',
  'Final Service',
  'Final Budget',
  'Converted At',
  'Created At',
];

const formatExportDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const exportLeads = async (req, res, next) => {
  try {
    const result = await leadService.getLeads({ ...req.query, page: 1, limit: 50000, _export: true }, req.user);
    const leads = result.data;

    const data = leads.map(l => ({
      'Company Name': l.companyName || '',
      'Business Category': l.businessCategory || l.businessType || '',
      'Sub Category': l.businessSubCategory || '',
      Website: l.website || '',
      Address: l.address || '',
      City: l.city || '',
      State: l.state || '',
      Country: l.country || '',
      Pincode: l.pincode || '',
      'Business Description': l.businessDescription || '',
      'POC Name': l.name || '',
      'POC Job Title': l.pocJobTitle || '',
      'POC Phone': l.phone || '',
      'POC Alt Phone': l.alternatePhone || '',
      'POC Email': l.email || '',
      'POC LinkedIn': l.pocLinkedIn || '',
      'POC Talk Notes': l.pocTalkNotes || '',
      'Type of Reach': l.typeOfReach || l.source || '',
      'Reach Notes': l.reachNotes || '',
      Status: l.status || '',
      Priority: l.priority || '',
      'Added By': l.createdBy?.name || '',
      'Assigned To': l.assignedTo?.name || '',
      'Interested In': l.interestedIn || '',
      'Estimated Budget': l.estimatedBudget || '',
      'Total Calls': l.totalCalls ?? 0,
      'General Notes': l.notes || '',
      'Last Contacted': formatExportDate(l.lastContactedAt),
      'Next Follow-up': formatExportDate(l.nextFollowUpAt),
      'Final Service': l.finalService || '',
      'Final Budget': l.finalBudget || '',
      'Converted At': formatExportDate(l.convertedAt),
      'Created At': formatExportDate(l.createdAt),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data, { header: EXPORT_HEADERS });
    worksheet['!cols'] = EXPORT_HEADERS.map((header) => {
      const maxCellLen = data.reduce((max, row) => {
        const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        return Math.max(max, val.length);
      }, header.length);
      return { wch: Math.min(42, Math.max(14, maxCellLen + 3)) };
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const dateTag = new Date().toISOString().slice(0, 10);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="leads_export_${dateTag}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeads, getOptions, getLead, createLead, updateLead, deleteLead, changeStatus, assignLead, checkDuplicate, importLeads, exportLeads };
