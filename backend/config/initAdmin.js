const User = require('../models/User.model');

const syncAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  try {
    const normalizedEmail = adminEmail.toLowerCase().trim();

    // Check if an admin exists
    let admin = await User.findOne({ role: 'ADMIN' }).select('+password');
    if (!admin) {
      admin = await User.findOne({ email: normalizedEmail }).select('+password');
    }

    if (admin) {
      let needsSave = false;

      // Retain existing name and _id, only update credentials if changed
      if (admin.email !== normalizedEmail) {
        admin.email = normalizedEmail;
        needsSave = true;
      }

      if (admin.role !== 'ADMIN') {
        admin.role = 'ADMIN';
        needsSave = true;
      }

      if (!admin.isActive) {
        admin.isActive = true;
        needsSave = true;
      }

      const isMatch = await admin.comparePassword(adminPassword);
      if (!isMatch) {
        admin.password = adminPassword; // Pre-save hook hashes it
        needsSave = true;
      }

      if (needsSave) {
        await admin.save();
        console.log(`[AUTH] Admin credentials synced successfully: ${normalizedEmail}`);
      }
    } else {
      // If no admin exists in the system, create one
      await User.create({
        name: 'Admin',
        email: normalizedEmail,
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
      });
      console.log(`[AUTH] Default admin initialized: ${normalizedEmail}`);
    }
  } catch (err) {
    console.error('[AUTH] Failed to sync admin credentials:', err.message);
  }
};

module.exports = syncAdmin;
