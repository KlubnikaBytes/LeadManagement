const User = require('../models/User.model');

const syncAdmin = async () => {
  const adminConfigs = [];

  // Primary Admin
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    adminConfigs.push({
      email: process.env.ADMIN_EMAIL.toLowerCase().trim(),
      password: process.env.ADMIN_PASSWORD,
      defaultName: 'Asif Shaikh',
    });
  }

  // Secondary Admin
  if (process.env.ADMIN2_EMAIL && process.env.ADMIN2_PASSWORD) {
    adminConfigs.push({
      email: process.env.ADMIN2_EMAIL.toLowerCase().trim(),
      password: process.env.ADMIN2_PASSWORD,
      defaultName: 'Debarun Guria',
    });
  }

  // Support any further ADMIN*_EMAIL / ADMIN*_PASSWORD
  Object.keys(process.env).forEach((key) => {
    const match = key.match(/^ADMIN(\d+)_EMAIL$/);
    if (match) {
      const num = match[1];
      const email = process.env[key];
      const password = process.env[`ADMIN${num}_PASSWORD`];
      if (email && password && !adminConfigs.some((a) => a.email === email.toLowerCase().trim())) {
        adminConfigs.push({
          email: email.toLowerCase().trim(),
          password,
          defaultName: 'Admin',
        });
      }
    }
  });

  if (adminConfigs.length === 0) return;

  for (const config of adminConfigs) {
    try {
      let admin = await User.findOne({ email: config.email }).select('+password');

      if (admin) {
        let needsSave = false;
        if (admin.role !== 'ADMIN') {
          admin.role = 'ADMIN';
          needsSave = true;
        }
        if (!admin.isActive) {
          admin.isActive = true;
          needsSave = true;
        }
        const isMatch = await admin.comparePassword(config.password);
        if (!isMatch) {
          admin.password = config.password; // Pre-save hook hashes it
          needsSave = true;
        }
        if (needsSave) {
          await admin.save();
          console.log(`[AUTH] Admin credentials verified & updated for: ${config.email}`);
        }
      } else {
        await User.create({
          name: config.defaultName,
          email: config.email,
          password: config.password,
          role: 'ADMIN',
          isActive: true,
        });
        console.log(`[AUTH] New admin created: ${config.email} (${config.defaultName})`);
      }
    } catch (err) {
      console.error(`[AUTH] Failed to sync admin ${config.email}:`, err.message);
    }
  }
};

module.exports = syncAdmin;
