import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  // Check if admin user already exists
  let adminUser = await userRepo.findOne({ where: { email: 'admin@sks.com' } });

  if (!adminUser) {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    adminUser = userRepo.create({
      email: 'admin@sks.com',
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN,
    });

    await userRepo.save(adminUser);
    console.log('✅ Admin user seeded successfully');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed error', err);
  AppDataSource.destroy();
});
