/**
 * Seed script — creates 5 demo users, one per role.
 * Run: npm run seed
 *
 * Idempotent: skips users that already exist (by email).
 */
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { ROLES } from '../config/constants';

const seedUsers = [
  {
    name: 'Super Admin',
    email: 'admin@university.edu',
    passwordHash: 'Admin@123',
    role: ROLES.SUPER_ADMIN,
  },
  {
    name: 'Dr. Meera Sharma',
    email: 'hod@university.edu',
    passwordHash: 'Hod@1234',
    role: ROLES.HOD,
  },
  {
    name: 'Prof. Raj Kumar',
    email: 'faculty@university.edu',
    passwordHash: 'Faculty@123',
    role: ROLES.FACULTY,
    employeeId: 'EMP-001',
    designation: 'Assistant Professor',
    maxHoursPerDay: 6,
  },
  {
    name: 'Arjun Patel',
    email: 'student@university.edu',
    passwordHash: 'Student@123',
    role: ROLES.STUDENT,
    enrollmentNumber: 'CS21001',
    semester: 5,
    admissionYear: 2021,
    cgpa: 8.4,
  },
  {
    name: 'Priya Nair',
    email: 'finance@university.edu',
    passwordHash: 'Finance@123',
    role: ROLES.FINANCE_OFFICER,
  },
];

async function seed(): Promise<void> {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const data of seedUsers) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      process.stdout.write(`[Seed] Skipping existing user: ${data.email}\n`);
      skipped++;
      continue;
    }

    await User.create(data);
    process.stdout.write(`[Seed] Created user: ${data.email} (${data.role})\n`);
    created++;
  }

  process.stdout.write(
    `\n[Seed] Done — ${created} created, ${skipped} skipped.\n`
  );
  process.stdout.write('\nDemo credentials:\n');
  for (const u of seedUsers) {
    process.stdout.write(`  ${u.role.padEnd(16)} ${u.email}  /  ${u.passwordHash}\n`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err: unknown) => {
  process.stderr.write(`[Seed] Error: ${String(err)}\n`);
  process.exit(1);
});
