const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function addPhoneNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update Dr Ahmad's phone number
    const doctor = await User.findOneAndUpdate(
      { email: '233798@students.au.edu.pk' },
      { $set: { phone: '03001234567' } }, // Change to doctor's actual phone
      { new: true }
    );

    if (doctor) {
      console.log(`✅ Updated doctor: ${doctor.name} - Phone: ${doctor.phone}`);
    } else {
      console.log('❌ Doctor not found');
    }

    // Update patient's phone if needed
    const patient = await User.findOneAndUpdate(
      { email: 'mahammirza08@gmail.com' },
      { $set: { phone: '03056305151' } },
      { new: true }
    );

    if (patient) {
      console.log(`✅ Updated patient: ${patient.name} - Phone: ${patient.phone}`);
    }

    // Show all users with their phones
    console.log('\n📋 All Users:');
    const users = await User.find({ role: { $in: ['patient', 'doctor'] } })
      .select('name email role phone')
      .limit(10);

    users.forEach(u => {
      console.log(`${u.role} - ${u.name} (${u.email}) - Phone: ${u.phone || 'NO PHONE'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addPhoneNumbers();
