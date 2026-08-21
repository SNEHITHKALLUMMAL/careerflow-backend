import { connectDB, disconnectDB } from '../config/db.js';
import { College } from '../models/College.model.js';
import { User } from '../models/User.model.js';

const SAMPLE_COLLEGES = [
  {
    name: 'National Institute of Technology, Calicut',
    domainEmailSuffix: '@nitc.ac.in',
    city: 'Kozhikode',
    state: 'Kerala',
    superAdminApproved: true,
  },
  {
    name: 'Cochin University of Science and Technology',
    domainEmailSuffix: '@cusat.ac.in',
    city: 'Kochi',
    state: 'Kerala',
    superAdminApproved: true,
  },
  {
    name: 'College of Engineering, Trivandrum',
    domainEmailSuffix: '@cet.ac.in',
    city: 'Thiruvananthapuram',
    state: 'Kerala',
    superAdminApproved: true,
  },
];

async function seedColleges() {
  for (const college of SAMPLE_COLLEGES) {
    await College.updateOne({ name: college.name }, { $setOnInsert: college }, { upsert: true });
  }

  console.log(`✅ Seeded ${SAMPLE_COLLEGES.length} colleges`);
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || 'admin@careerflow.app';
  const password = process.env.SEED_SUPERADMIN_PASSWORD || 'ChangeMe123';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`ℹ️  Super admin ${email} already exists, skipping`);
    return;
  }

  await User.create({
    name: 'CareerFlow Super Admin',
    email,
    passwordHash: password, // hashed by the User pre-save hook
    role: 'superAdmin',
    isEmailVerified: true,
  });

  console.log(`✅ Seeded super admin: ${email} (change the password after first login)`);
}

async function seedPlacementOfficer() {
  const email = process.env.SEED_PLACEMENT_OFFICER_EMAIL || 'placement@careerflow.app';
  const password = process.env.SEED_PLACEMENT_OFFICER_PASSWORD || 'ChangeMe123';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`ℹ️  Placement officer ${email} already exists, skipping`);
    return;
  }

  const college = await College.findOne({ name: SAMPLE_COLLEGES[0].name });

  await User.create({
    name: 'CareerFlow Placement Officer',
    email,
    passwordHash: password, // hashed by the User pre-save hook
    role: 'placementOfficer',
    collegeId: college?._id || null,
    isEmailVerified: true,
  });

  console.log(`✅ Seeded placement officer: ${email} (linked to ${college?.name || 'no college'})`);
}

async function main() {
  await connectDB();
  await seedColleges();
  await seedSuperAdmin();
  await seedPlacementOfficer();
  await disconnectDB();

  console.log('🌱 Seeding complete');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exitCode = 1;
});
