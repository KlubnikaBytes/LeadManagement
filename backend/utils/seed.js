require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User.model');
const Lead = require('../models/Lead.model');
const Call = require('../models/Call.model');
const FollowUp = require('../models/FollowUp.model');
const Note = require('../models/Note.model');
const Activity = require('../models/Activity.model');

const SEED_PASSWORD = 'CRM@2026';

const users = [
  { name: 'Admin User', email: 'admin@example.com', password: SEED_PASSWORD, role: 'ADMIN' },
  { name: 'Rajesh Kumar', email: 'leader@example.com', password: SEED_PASSWORD, role: 'TEAM_LEADER' },
  { name: 'Akash Singh', email: 'sales1@example.com', password: SEED_PASSWORD, role: 'SALES_EXECUTIVE' },
  { name: 'Priya Sharma', email: 'sales2@example.com', password: SEED_PASSWORD, role: 'SALES_EXECUTIVE' },
  { name: 'Rahul Gupta', email: 'sales3@example.com', password: SEED_PASSWORD, role: 'SALES_EXECUTIVE' },
];

const sources = ['Cold Call','Instagram','Facebook','LinkedIn','Google','Website','Referral','WhatsApp','Justdial','IndiaMART'];
const statuses = ['NEW','CONTACTED','INTERESTED','CALL_LATER','FOLLOW_UP','NOT_INTERESTED','CONVERTED','LOST'];
const priorities = ['LOW','MEDIUM','HIGH','URGENT'];
const cities = ['Mumbai','Delhi','Bangalore','Kolkata','Chennai','Hyderabad','Pune','Ahmedabad','Jaipur','Surat'];
const businessTypes = ['Restaurant','Salon','Retail Store','IT Company','Hospital','Education','Manufacturing','E-commerce','Real Estate','Logistics'];
const services = ['Website Development','Mobile App','E-commerce Portal','SEO Services','Digital Marketing','CRM Development','ERP System','Custom Software'];
const budgets = ['₹50,000 - ₹1,00,000','₹1,00,000 - ₹2,50,000','₹2,50,000 - ₹5,00,000','₹5,00,000+','₹20,000 - ₹50,000'];

const firstNames = ['Rahul','Amit','Priya','Sneha','Raj','Vikram','Neha','Suresh','Anita','Mohan','Kavya','Arjun','Deepa','Sanjay','Pooja','Kiran','Manoj','Ritu','Anil','Sunita','Rohit','Meera','Ajay','Nisha','Vivek'];
const lastNames = ['Sharma','Kumar','Gupta','Singh','Patel','Shah','Verma','Yadav','Mishra','Joshi','Agarwal','Mehta','Chopra','Bose','Nair','Reddy','Pillai','Iyer','Das','Roy'];
const companies = ['ABC Restaurant','XYZ Salon','Tech Solutions','Fashion Hub','Green Foods','Smart Clinic','EduTech Academy','City Mall','Prime Realty','LogiCo Pvt Ltd','Taste Kitchen','Style Studio','Digital World','Health First','Learn & Grow','Metro Traders','Quick Fix Services','Star Properties','Fresh Mart','Globe Logistics'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (daysAgo, daysAhead = 0) => {
  const now = new Date();
  const past = new Date(now - daysAgo * 86400000);
  const future = new Date(now.getTime() + daysAhead * 86400000);
  return new Date(past.getTime() + Math.random() * (future.getTime() - past.getTime()));
};

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Call.deleteMany({}),
      FollowUp.deleteMany({}),
      Note.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(users.map(u => ({ ...u })));
    console.log(`Created ${createdUsers.length} users`);

    const admin = createdUsers.find(u => u.role === 'ADMIN');
    const leader = createdUsers.find(u => u.role === 'TEAM_LEADER');
    const salesUsers = createdUsers.filter(u => u.role === 'SALES_EXECUTIVE');

    // Set team leader
    for (const su of salesUsers) {
      su.teamLeader = leader._id;
      await su.save({ validateBeforeSave: false });
    }

    // Create leads
    const allAssignees = [...salesUsers, leader];
    const leads = [];

    for (let i = 0; i < 50; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const name = `${firstName} ${lastName}`;
      const company = companies[i % companies.length];
      const status = randomItem(statuses);
      const assignee = randomItem(allAssignees);
      const createdAt = randomDate(60, 0);

      const titles = ['Founder & CEO', 'Managing Director', 'VP of Marketing', 'Chief Technology Officer', 'Head of Sales', 'Operations Director'];
      const lead = {
        name,
        pocJobTitle: randomItem(titles),
        companyName: company,
        phone: `9${randomInt(100000000, 999999999)}`,
        alternatePhone: `9${randomInt(100000000, 999999999)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        pocLinkedIn: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        pocTalkNotes: 'Spoke with POC regarding digital growth and system requirements. Positive reception and requested detailed scope of work.',
        businessCategory: randomItem(businessTypes),
        businessSubCategory: 'Commercial Services',
        businessType: randomItem(businessTypes),
        website: `https://www.${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        address: `Tower ${randomInt(1, 10)}, Floor ${randomInt(1, 14)}, Business Hub`,
        city: randomItem(cities),
        state: 'Maharashtra',
        country: 'India',
        pincode: `4000${randomInt(10, 99)}`,
        businessDescription: `${company} is an established enterprise looking to automate and streamline their customer operations.`,
        typeOfReach: randomItem(sources),
        source: randomItem(sources),
        reachNotes: 'Initial outreach conducted with executive decision-maker.',
        status,
        priority: randomItem(priorities),
        assignedTo: assignee._id,
        interestedIn: randomItem(services),
        estimatedBudget: randomItem(budgets),
        totalCalls: randomInt(0, 10),
        lastContactedAt: status !== 'NEW' ? randomDate(30) : null,
        nextFollowUpAt: ['INTERESTED','FOLLOW_UP','CALL_LATER'].includes(status) ? randomDate(-7, 14) : null,
        createdBy: admin._id,
        createdAt,
      };

      if (status === 'CONVERTED') {
        lead.convertedAt = randomDate(10);
        lead.convertedBy = assignee._id;
        lead.finalService = randomItem(services);
        lead.finalBudget = randomItem(budgets);
      }

      leads.push(lead);
    }

    const createdLeads = await Lead.create(leads);
    console.log(`Created ${createdLeads.length} leads`);

    // Create calls and activities for some leads
    const callOutcomes = ['Connected','No Answer','Busy','Interested','Not Interested','Call Back Requested'];
    let callCount = 0;
    let followupCount = 0;

    for (const lead of createdLeads.slice(0, 30)) {
      const numCalls = lead.totalCalls > 0 ? Math.min(lead.totalCalls, 3) : 0;

      for (let c = 0; c < numCalls; c++) {
        await Call.create({
          lead: lead._id,
          calledBy: lead.assignedTo,
          callDate: randomDate(30),
          duration: `${randomInt(0, 10)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
          outcome: randomItem(callOutcomes),
          notes: 'Client discussed requirements. Will follow up.',
        });
        callCount++;
      }

      // Create activity
      await Activity.create({
        lead: lead._id,
        user: admin._id,
        type: 'LEAD_CREATED',
        description: `Lead created: ${lead.name}`,
        metadata: { source: lead.source },
        createdAt: lead.createdAt,
      });

      if (lead.assignedTo) {
        await Activity.create({
          lead: lead._id,
          user: admin._id,
          type: 'LEAD_ASSIGNED',
          description: 'Lead assigned to team member',
          metadata: { assignedTo: lead.assignedTo },
          createdAt: lead.createdAt,
        });
      }

      // Create follow-ups for some leads
      if (['INTERESTED', 'FOLLOW_UP', 'CALL_LATER'].includes(lead.status) && lead.nextFollowUpAt) {
        await FollowUp.create({
          lead: lead._id,
          assignedTo: lead.assignedTo,
          createdBy: admin._id,
          followUpDate: lead.nextFollowUpAt,
          type: randomItem(['Call', 'Meeting', 'WhatsApp', 'Demo']),
          note: 'Scheduled follow-up',
          status: lead.nextFollowUpAt < new Date() ? 'MISSED' : 'PENDING',
        });
        followupCount++;
      }

      // Add a note to some leads
      if (Math.random() > 0.5) {
        await Note.create({
          lead: lead._id,
          createdBy: lead.assignedTo,
          text: `Client is interested in ${lead.interestedIn}. Budget is approximately ${lead.estimatedBudget}. Will discuss further in next call.`,
        });
      }
    }

    console.log(`Created ${callCount} calls, ${followupCount} follow-ups`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n--- Login Credentials ---');
    console.log(`Admin:      admin@example.com  / ${SEED_PASSWORD}`);
    console.log(`Leader:     leader@example.com / ${SEED_PASSWORD}`);
    console.log(`Sales 1:    sales1@example.com / ${SEED_PASSWORD}`);
    console.log(`Sales 2:    sales2@example.com / ${SEED_PASSWORD}`);
    console.log(`Sales 3:    sales3@example.com / ${SEED_PASSWORD}`);
    console.log('\n⚠️  Change passwords in production!');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
