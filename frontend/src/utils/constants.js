export const STATUSES = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'CALL_LATER', label: 'Call Later' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
]

export const REACH_TYPES = [
  'Cold Call',
  'LinkedIn Outreach',
  'Email Outreach',
  'WhatsApp Outreach',
  'Website Inbound',
  'Referral',
  'Instagram / Facebook / Social Media',
  'Networking Event / In-Person',
  'IndiaMART / Justdial / B2B Portal',
  'Google Search / Ads',
  'Direct Walk-in',
  'Other',
]

export const BUSINESS_CATEGORIES_MAP = {
  'IT & Software': [
    'SaaS / Product',
    'Custom Software Development',
    'Web & App Agency',
    'AI & Automation',
    'Cloud & DevOps Services',
    'Cybersecurity',
    'IT Staffing & Consulting',
    'Other IT'
  ],
  'Food, Hospitality & Dining': [
    'Restaurant / Fine Dining',
    'Cafe & Bakery',
    'Cloud Kitchen / Food Delivery',
    'Hotel & Resort',
    'Bar & Brewery',
    'Catering Services',
    'Other Food'
  ],
  'Healthcare & Wellness': [
    'Hospital & Clinic',
    'Dental Care',
    'Diagnostic & Pathology Lab',
    'Pharmacy & Medical Stores',
    'Fitness / Gym / Yoga Studio',
    'Salon & Spa',
    'Ayurveda & Alternative Medicine',
    'Other Healthcare'
  ],
  'Retail & E-commerce': [
    'Fashion & Apparel',
    'Electronics & Gadgets',
    'Grocery & Supermarket',
    'Jewelry & Luxury Goods',
    'Home Decor & Furniture',
    'D2C Brand',
    'Other Retail'
  ],
  'Real Estate & Construction': [
    'Real Estate Agency / Brokerage',
    'Builders & Developers',
    'Architectural & Interior Design',
    'Civil Construction & Contractors',
    'Commercial Property Management',
    'Other Real Estate'
  ],
  'Education & Training': [
    'School / College / University',
    'EdTech & Online Learning',
    'Coaching & Competitive Exam Prep',
    'Language & Skill Training Institutes',
    'Other Education'
  ],
  'Manufacturing & Industrial': [
    'Textile & Garment Manufacturing',
    'Automotive & Engineering Parts',
    'Chemical & Pharmaceutical',
    'Packaging & Plastics',
    'Machinery & Tools',
    'Other Manufacturing'
  ],
  'Professional & Financial Services': [
    'Chartered Accountant & Tax Firm',
    'Law Firm & Legal Consulting',
    'Digital Marketing Agency',
    'Management & Business Consulting',
    'Insurance & Wealth Management',
    'Other Professional'
  ],
  'Logistics & Supply Chain': [
    'Courier & Parcel Delivery',
    'Freight Forwarding & Cargo',
    'Warehousing & Cold Storage',
    'Fleet & Transport Operations',
    'Other Logistics'
  ],
  'Other Industry': [
    'General Services',
    'Custom Subcategory'
  ]
}

export const BUSINESS_CATEGORIES = Object.keys(BUSINESS_CATEGORIES_MAP)

export const SOURCES = [
  'Cold Call','Instagram','Facebook','LinkedIn','Google','Website',
  'Referral','WhatsApp','Email','Justdial','IndiaMART','Naukri',
  'Manual Entry','Other',
]

export const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT']

export const CALL_OUTCOMES = [
  'Connected','No Answer','Busy','Call Back Requested',
  'Interested','Not Interested','Wrong Number','Converted',
]

export const FOLLOWUP_TYPES = ['Call','Meeting','WhatsApp','Email','Demo','Proposal','Other']

export const BUSINESS_TYPES = [
  'Restaurant','Salon','Retail Store','IT Company','Hospital','Education',
  'Manufacturing','E-commerce','Real Estate','Logistics','Hotel','Gym',
  'Pharmacy','Consultancy','Other',
]

export const SERVICES = [
  'Website Development','Mobile App Development','E-commerce Portal',
  'SEO Services','Digital Marketing','CRM Development','ERP System',
  'Custom Software','UI/UX Design','Cloud Solutions','API Development','Other',
]

export const STATUS_LABELS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  CALL_LATER: 'Call Later',
  FOLLOW_UP: 'Follow Up',
  NOT_INTERESTED: 'Not Interested',
  CONVERTED: 'Converted',
  LOST: 'Lost',
}

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}
