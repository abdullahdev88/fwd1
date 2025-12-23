const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Hash password
    const hashedPassword = await bcrypt.hash('doctor123', 10);

    // Create sample doctors
    const doctors = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        password: hashedPassword,
        phone: '+1-555-0101',
        role: 'doctor',
        specialization: 'Cardiology',
        experience: 15,
        education: 'MD from Harvard Medical School',
        status: 'approved'
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@hospital.com',
        password: hashedPassword,
        phone: '+1-555-0102',
        role: 'doctor',
        specialization: 'Neurology',
        experience: 12,
        education: 'MD from Johns Hopkins University',
        status: 'approved'
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@hospital.com',
        password: hashedPassword,
        phone: '+1-555-0103',
        role: 'doctor',
        specialization: 'Pediatrics',
        experience: 10,
        education: 'MD from Stanford University',
        status: 'approved'
      },
      {
        name: 'Dr. James Wilson',
        email: 'james.wilson@hospital.com',
        password: hashedPassword,
        phone: '+1-555-0104',
        role: 'doctor',
        specialization: 'Orthopedics',
        experience: 18,
        education: 'MD from Yale School of Medicine',
        status: 'approved'
      },
      {
        name: 'Dr. Lisa Anderson',
        email: 'lisa.anderson@hospital.com',
        password: hashedPassword,
        phone: '+1-555-0105',
        role: 'doctor',
        specialization: 'Dermatology',
        experience: 8,
        education: 'MD from Columbia University',
        status: 'approved'
      }
    ];

    // Insert doctors
    const insertedDoctors = await User.insertMany(doctors);
    console.log(`✅ Added ${insertedDoctors.length} doctors to database`);
    
    console.log('\n📋 Sample Doctor Accounts Created:');
    console.log('================================');
    insertedDoctors.forEach(doc => {
      console.log(`👨‍⚕️  ${doc.name} (${doc.specialization})`);
      console.log(`   Email: ${doc.email}`);
      console.log(`   Password: doctor123`);
      console.log('');
    });

    console.log('✅ Database seeding completed!');
    console.log('\n🔐 You can now login with any doctor account using:');
    console.log('   Email: (any email from above)');
    console.log('   Password: doctor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
