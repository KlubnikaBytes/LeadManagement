const Lead = require('../models/Lead.model');
const { createActivity } = require('../utils/helpers');

const VALID_STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'CALL_LATER', 'FOLLOW_UP', 'NOT_INTERESTED', 'CONVERTED', 'LOST'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const extractPhones = (str) => {
  if (!str) return [];
  return String(str)
    .split(/[/,;|]|\bor\b|\band\b/i)
    .map((p) => p.replace(/[^\d+]/g, '').trim())
    .filter((p) => p.replace(/\D/g, '').length >= 6);
};

const cleanWebsite = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^(no\s*website|none|n\/a|na|-|nil|null|not\s*available)$/i.test(trimmed)) {
    return '';
  }
  return trimmed;
};

const cleanEmail = (val) => {
  if (!val) return '';
  const trimmed = String(val).trim().toLowerCase();
  if (/^(no\s*email|none|n\/a|na|-|nil|null|not\s*available)$/i.test(trimmed)) {
    return '';
  }
  return trimmed;
};

// Robust value extractor matching various header naming styles
const getVal = (row, ...keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const cleanK = k.toLowerCase().replace(/[\s_\-]/g, '');
    const found = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_\-]/g, '') === cleanK);
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
      return String(row[found]).trim();
    }
  }
  return '';
};

const normalizeStatus = (raw) => {
  if (!raw) return 'NEW';
  const clean = raw.toString().trim().toUpperCase().replace(/\s+/g, '_');
  if (VALID_STATUSES.includes(clean)) return clean;
  if (clean === 'WON') return 'CONVERTED';
  return 'NEW';
};

const normalizePriority = (raw) => {
  if (!raw) return 'MEDIUM';
  const clean = raw.toString().trim().toUpperCase();
  if (VALID_PRIORITIES.includes(clean)) return clean;
  return 'MEDIUM';
};

const processImport = async (records, user, selectedAssigneeId) => {
  const userId = user?._id || user;
  const userRole = user?.role;

  // Determine effective assignee:
  // If user is SALES_EXECUTIVE, automatically assign to themselves.
  // If ADMIN or TEAM_LEADER, use selectedAssigneeId if provided.
  let effectiveAssignedTo = null;
  if (userRole === 'SALES_EXECUTIVE') {
    effectiveAssignedTo = userId;
  } else if (selectedAssigneeId) {
    effectiveAssignedTo = selectedAssigneeId;
  }

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
  const seenPhones = new Set();
  const seenEmails = new Set();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2;
    const errors = [];

    // 1. Mandatory Fields & Smart Name Fallbacks
    let name = getVal(row, 'POC Name', 'pocName', 'Name', 'name', 'Contact Person', 'contactPerson');
    const companyName = getVal(row, 'Company Name', 'companyName', 'Company', 'company', 'Business Name', 'businessName');
    const pocJobTitle = getVal(row, 'POC Job Title', 'pocJobTitle', 'Job Title', 'jobTitle', 'Designation', 'designation');

    // Smart fallback if POC Name column was left blank by user:
    if (!name) {
      if (companyName && /^(dr|mr|ms|mrs|prof)\.?\s+/i.test(companyName)) {
        name = companyName; // e.g. "Dr. Nilanjan Chandra", "Dr. Amit Dey"
      } else if (pocJobTitle) {
        name = pocJobTitle; // e.g. "Reception", "Manager"
      } else if (companyName) {
        name = companyName; // e.g. "Shapoorji Clinic & Diagnostics"
      } else {
        name = 'Contact Person';
      }
    }

    if (!name && !companyName) {
      errors.push('POC Name or Company Name is required');
    }

    // 2. Phone Extraction (handles primary, alt phone fallback, and multiple numbers like "9876543210 / 9876543211")
    const rawPhoneField = getVal(
      row,
      'POC Phone',
      'pocPhone',
      'Phone',
      'phone',
      'Mobile',
      'mobile',
      'Contact Number',
      'contactNumber',
      'Primary Phone'
    );
    const rawAltPhoneField = getVal(
      row,
      'POC Alt Phone',
      'pocAltPhone',
      'Alternate Phone',
      'alternatePhone',
      'Alt Phone',
      'altPhone',
      'WhatsApp',
      'whatsapp'
    );

    const primaryPhones = extractPhones(rawPhoneField);
    const altPhones = extractPhones(rawAltPhoneField);

    const phone = primaryPhones[0] || altPhones[0] || '';
    const alternatePhone =
      primaryPhones[1] || (primaryPhones.length > 0 ? altPhones[0] : altPhones[1]) || '';

    if (!phone) {
      errors.push('Valid Phone Number is required (at least 6 digits)');
    }

    if (errors.length > 0) {
      results.invalid++;
      results.errors.push({ row: rowNum, errors });
      continue;
    }

    const email = cleanEmail(getVal(row, 'POC Email', 'pocEmail', 'Email', 'email'));
    const website = cleanWebsite(getVal(row, 'Website', 'website', 'URL', 'url'));

    // In-batch duplicate check
    if (seenPhones.has(phone)) {
      results.duplicates++;
      results.duplicateLeads.push({ row: rowNum, name, phone, existing: { name, phone, reason: 'Duplicate in file' } });
      continue;
    }
    if (email && seenEmails.has(email)) {
      results.duplicates++;
      results.duplicateLeads.push({ row: rowNum, name, phone, existing: { name, email, reason: 'Duplicate email in file' } });
      continue;
    }

    // Database duplicate check
    const dupFilter = [{ phone, isDeleted: false }];
    if (email) dupFilter.push({ email, isDeleted: false });
    const duplicate = await Lead.findOne({ $or: dupFilter }).select('name phone email');

    if (duplicate) {
      results.duplicates++;
      results.duplicateLeads.push({ row: rowNum, name, phone, existing: duplicate });
      continue;
    }

    // Add to seen sets for this batch
    seenPhones.add(phone);
    if (email) seenEmails.add(email);

    // 2. Business Information
    const businessCategory = getVal(row, 'Business Category', 'businessCategory', 'BusinessType', 'businessType', 'Category', 'category');
    const businessSubCategory = getVal(row, 'Sub Category', 'subCategory', 'Business Sub Category', 'businessSubCategory');
    const address = getVal(row, 'Address', 'address');
    const city = getVal(row, 'City', 'city');
    const state = getVal(row, 'State', 'state');
    const country = getVal(row, 'Country', 'country') || 'India';
    const pincode = getVal(row, 'Pincode', 'pincode', 'Pin Code', 'pinCode', 'Zip', 'zip');
    const businessDescription = getVal(row, 'Business Description', 'businessDescription', 'Description', 'description');

    // 3. Contact Details
    const pocLinkedIn = getVal(row, 'POC LinkedIn', 'pocLinkedIn', 'LinkedIn', 'linkedin');
    const pocTalkNotes = getVal(row, 'POC Talk Notes', 'pocTalkNotes', 'Talk Notes', 'talkNotes');

    // 4. Outreach / Type of Reach
    const typeOfReach = getVal(row, 'Type of Reach', 'typeOfReach', 'Source', 'source') || 'Cold Call';
    const source = typeOfReach;
    const reachNotes = getVal(row, 'Reach Notes', 'reachNotes');

    // 5. Sales & Pipeline Details
    const interestedIn = getVal(row, 'Interested In', 'interestedIn', 'Service', 'service');
    const estimatedBudget = getVal(row, 'Estimated Budget', 'estimatedBudget', 'Budget', 'budget');
    const status = normalizeStatus(getVal(row, 'Status', 'status'));
    const priority = normalizePriority(getVal(row, 'Priority', 'priority'));
    const notes = getVal(row, 'General Notes', 'generalNotes', 'Notes', 'notes', 'Comments', 'comments');

    results.valid++;
    validRecords.push({
      name,
      pocJobTitle,
      phone,
      alternatePhone,
      email,
      pocLinkedIn,
      pocTalkNotes,
      companyName,
      businessCategory,
      businessSubCategory,
      businessType: businessCategory,
      website,
      address,
      city,
      state,
      country,
      pincode,
      businessDescription,
      typeOfReach,
      source,
      reachNotes,
      status,
      priority,
      interestedIn,
      estimatedBudget,
      notes,
      assignedTo: effectiveAssignedTo || null,
      primaryAssignedTo: effectiveAssignedTo || null,
      primaryAssignedAt: effectiveAssignedTo ? new Date() : null,
      assignmentHistory: effectiveAssignedTo
        ? [
            {
              assignedTo: effectiveAssignedTo,
              assignedBy: userId,
              type: 'PRIMARY',
              assignedAt: new Date(),
              note: userRole === 'SALES_EXECUTIVE' ? 'Auto-assigned upon bulk import' : 'Bulk imported and assigned',
            },
          ]
        : [],
      createdBy: userId,
    });
  }

  if (validRecords.length > 0) {
    const inserted = await Lead.insertMany(validRecords, { ordered: false });
    results.imported = inserted.length;

    // Create activity logs for imported leads
    for (const lead of inserted) {
      await createActivity({
        lead: lead._id,
        user: userId,
        type: 'LEAD_CREATED',
        description: `Lead imported from file: ${lead.name}`,
        metadata: { source: lead.typeOfReach || lead.source, importedBulk: true },
      });
    }
  }

  return results;
};

module.exports = { processImport };
