const Lead = require('../models/Lead.model');
const leadService = require('../services/lead.service');
const Note = require('../models/Note.model');
const DropdownOption = require('../models/DropdownOption.model');
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
    const savedOptions = await DropdownOption.find({}).sort({ value: 1 }).lean();

    const grouped = {
      sources: [],
      businessTypes: [],
      businessCategories: [],
      businessSubCategories: [],
      subCategoriesByCategory: {},
      services: [],
      statuses: [],
      reachTypes: [],
    };

    for (const opt of savedOptions) {
      if (opt.field === 'businessCategory') {
        grouped.businessCategories.push(opt.value);
      } else if (opt.field === 'businessSubCategory') {
        grouped.businessSubCategories.push(opt.value);
        if (opt.parentCategory) {
          if (!grouped.subCategoriesByCategory[opt.parentCategory]) {
            grouped.subCategoriesByCategory[opt.parentCategory] = [];
          }
          grouped.subCategoriesByCategory[opt.parentCategory].push(opt.value);
        }
      } else if (opt.field === 'typeOfReach') {
        grouped.reachTypes.push(opt.value);
        grouped.sources.push(opt.value);
      } else if (opt.field === 'interestedIn') {
        grouped.services.push(opt.value);
      } else if (opt.field === 'status') {
        grouped.statuses.push(opt.value);
      }
    }

    res.json({
      success: true,
      data: grouped,
    });
  } catch (err) {
    next(err);
  }
};

const addOption = async (req, res, next) => {
  try {
    const { field, value, parentCategory = '' } = req.body;
    const allowedFields = ['businessCategory', 'businessSubCategory', 'typeOfReach', 'interestedIn', 'status'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: 'Invalid dropdown field' });
    }
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Option value is required' });
    }

    const option = await DropdownOption.findOneAndUpdate(
      { field, value: trimmed, parentCategory: String(parentCategory || '').trim() },
      {
        $setOnInsert: {
          field,
          value: trimmed,
          parentCategory: String(parentCategory || '').trim(),
          createdBy: req.user._id,
        },
      },
      { upsert: true, new: true }
    );

    req.app.get('io')?.emit('options_updated');
    res.status(201).json({ success: true, data: option });
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
    const lead = await leadService.changeLeadStatus(req.params.id, status, req.user, extra);
    req.app.get('io')?.emit('lead_updated');
    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

const assignLead = async (req, res, next) => {
  try {
    const { assignedTo, note, assignedByName } = req.body;
    if (!assignedTo) return res.status(400).json({ success: false, message: 'assignedTo is required' });
    const lead = await leadService.assignLead(req.params.id, assignedTo, req.user._id, note, assignedByName);
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
    const result = await processImport(records, req.user, assignedTo);
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
  'Primary Assigned To',
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

    const data = leads.map((l) => {
      const canViewSales = l.canViewSalesSection !== false;
      return {
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
        Status: canViewSales ? (l.status || '') : 'Restricted',
        Priority: canViewSales ? (l.priority || '') : '',
        'Added By': l.createdBy?.name || '',
        'Primary Assigned To': l.primaryAssignedTo?.name || '',
        'Assigned To': l.assignedTo?.name || '',
        'Interested In': canViewSales ? (l.interestedIn || '') : '',
        'Estimated Budget': canViewSales ? (l.estimatedBudget || '') : '',
        'Total Calls': canViewSales ? (l.totalCalls ?? 0) : '',
        'General Notes': canViewSales ? (l.notes || '') : '',
        'Last Contacted': canViewSales ? formatExportDate(l.lastContactedAt) : '',
        'Next Follow-up': canViewSales ? formatExportDate(l.nextFollowUpAt) : '',
        'Final Service': canViewSales ? (l.finalService || '') : '',
        'Final Budget': canViewSales ? (l.finalBudget || '') : '',
        'Converted At': canViewSales ? formatExportDate(l.convertedAt) : '',
        'Created At': formatExportDate(l.createdAt),
      };
    });

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

const getImportTemplate = async (req, res, next) => {
  try {
    const templateData = [
      {
        'Company Name': 'Sharma Enterprises',
        'Business Category': 'Restaurant',
        'Sub Category': 'Cafe & Bakery',
        'Website': 'https://sharmacafe.example.com',
        'Address': '12/A Park Street, Ground Floor',
        'City': 'Kolkata',
        'State': 'West Bengal',
        'Country': 'India',
        'Pincode': '700016',
        'Business Description': 'Popular cafe looking to develop custom delivery mobile app and web portal',
        'POC Name': 'Rajesh Sharma',
        'POC Job Title': 'Managing Director',
        'POC Phone': '9876543210',
        'POC Alt Phone': '9876543211',
        'POC Email': 'rajesh@sharmacafe.example.com',
        'POC LinkedIn': 'https://linkedin.com/in/rajesh-sharma',
        'POC Talk Notes': 'Spoke with Rajesh; they want an online ordering portal by next month.',
        'Type of Reach': 'Cold Call',
        'Reach Notes': 'Contacted directly from local business registry',
        'Status': 'NEW',
        'Priority': 'HIGH',
        'Interested In': 'Mobile App Development',
        'Estimated Budget': '₹1,50,000 - ₹2,50,000',
        'General Notes': 'Follow up next Tuesday morning after menu review',
      },
      {
        'Company Name': 'Gupta Dental Care',
        'Business Category': 'Healthcare',
        'Sub Category': 'Dental Clinic',
        'Website': 'https://guptadental.example.com',
        'Address': '45 MG Road, Near City Mall',
        'City': 'Mumbai',
        'State': 'Maharashtra',
        'Country': 'India',
        'Pincode': '400001',
        'Business Description': 'Multi-specialty dental clinic expanding to 3 locations',
        'POC Name': 'Dr. Priya Gupta',
        'POC Job Title': 'Clinic Owner',
        'POC Phone': '9123456780',
        'POC Alt Phone': '',
        'POC Email': 'drpriya@guptadental.example.com',
        'POC LinkedIn': '',
        'POC Talk Notes': 'Interested in appointment booking system and SEO services',
        'Type of Reach': 'Instagram',
        'Reach Notes': 'Replied to direct Instagram campaign outreach',
        'Status': 'NEW',
        'Priority': 'MEDIUM',
        'Interested In': 'Website Development',
        'Estimated Budget': '₹75,000 - ₹1,00,000',
        'General Notes': 'Prefers WhatsApp updates on weekends',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    const headers = Object.keys(templateData[0]);
    worksheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 3, 16) }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="leads_sample_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const searchCompanies = async (req, res, next) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    const data = await leadService.searchCompanies(q);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeads, getOptions, addOption, getLead, createLead, updateLead, deleteLead, changeStatus, assignLead, checkDuplicate, importLeads, exportLeads, getImportTemplate, searchCompanies };
