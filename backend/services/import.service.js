const Lead = require('../models/Lead.model');
const { createActivity } = require('../utils/helpers');

const VALID_SOURCES = ['Cold Call','Instagram','Facebook','LinkedIn','Google','Website','Referral','WhatsApp','Email','Justdial','IndiaMART','Naukri','Manual Entry','Other'];
const VALID_STATUSES = ['NEW','CONTACTED','INTERESTED','CALL_LATER','FOLLOW_UP','NOT_INTERESTED','CONVERTED','LOST'];
const VALID_PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];

const processImport = async (records, userId, assignedTo) => {
  const results = {
    total: records.length,
    valid: 0,
    duplicates: 0,
    invalid: 0,
    imported: 0,
    errors: [],
    duplicateLeads: [],
  };

  const validRecords = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2;
    const errors = [];

    if (!row.Name && !row.name) errors.push('Name is required');
    if (!row.Phone && !row.phone) errors.push('Phone is required');

    const phone = (row.Phone || row.phone || '').toString().trim();
    const email = (row.Email || row.email || '').toString().trim().toLowerCase();
    const source = row.Source || row.source || 'Manual Entry';
    const status = row.Status || row.status || 'NEW';
    const priority = row.Priority || row.priority || 'MEDIUM';

    if (source && !VALID_SOURCES.includes(source)) errors.push(`Invalid source: ${source}`);
    if (status && !VALID_STATUSES.includes(status)) errors.push(`Invalid status: ${status}`);
    if (priority && !VALID_PRIORITIES.includes(priority)) errors.push(`Invalid priority: ${priority}`);

    if (errors.length > 0) {
      results.invalid++;
      results.errors.push({ row: rowNum, errors });
      continue;
    }

    // Check duplicate
    const dupFilter = [{ phone, isDeleted: false }];
    if (email) dupFilter.push({ email, isDeleted: false });
    const duplicate = await Lead.findOne({ $or: dupFilter }).select('name phone email');

    if (duplicate) {
      results.duplicates++;
      results.duplicateLeads.push({ row: rowNum, name: row.Name || row.name, phone, existing: duplicate });
      continue;
    }

    results.valid++;
    validRecords.push({
      name: (row.Name || row.name || '').trim(),
      companyName: (row.Company || row.CompanyName || row.company || row.companyName || '').trim(),
      phone,
      alternatePhone: (row.AlternatePhone || row.alternatePhone || '').toString().trim(),
      email,
      website: (row.Website || row.website || '').trim(),
      city: (row.City || row.city || '').trim(),
      state: (row.State || row.state || '').trim(),
      country: (row.Country || row.country || 'India').trim(),
      businessType: (row.BusinessType || row.businessType || '').trim(),
      source,
      status,
      priority,
      interestedIn: (row.InterestedIn || row.interestedIn || '').trim(),
      estimatedBudget: (row.Budget || row.budget || row.EstimatedBudget || row.estimatedBudget || '').toString().trim(),
      assignedTo: assignedTo || null,
      createdBy: userId,
    });
  }

  if (validRecords.length > 0) {
    const inserted = await Lead.insertMany(validRecords, { ordered: false });
    results.imported = inserted.length;

    // Create activities for imported leads
    for (const lead of inserted) {
      await createActivity({
        lead: lead._id,
        user: userId,
        type: 'LEAD_CREATED',
        description: `Lead imported: ${lead.name}`,
        metadata: { source: lead.source, importedBulk: true },
      });
    }
  }

  return results;
};

module.exports = { processImport };
