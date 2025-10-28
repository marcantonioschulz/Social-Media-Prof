import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../../config/typeorm.config';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  try {
    // Create default organization
    const organizationRepo = dataSource.getRepository(Organization);
    let organization = await organizationRepo.findOne({
      where: { slug: 'demo-company' },
    });

    if (!organization) {
      organization = organizationRepo.create({
        name: 'Demo Company',
        slug: 'demo-company',
        description: 'Demo organization for testing',
        isActive: true,
        settings: {
          requireApproval: true,
          approvalSteps: 2,
        },
      });
      await organizationRepo.save(organization);
      console.log('✅ Created demo organization');
    } else {
      console.log('ℹ️  Demo organization already exists');
    }

    // Create admin user
    const userRepo = dataSource.getRepository(User);
    const adminExists = await userRepo.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      const admin = userRepo.create({
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ORGANIZATION_ADMIN,
        organizationId: organization.id,
        isActive: true,
        isEmailVerified: true,
      });
      await userRepo.save(admin);
      console.log('✅ Created admin user: admin@example.com / Admin123!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create manager user
    const managerExists = await userRepo.findOne({
      where: { email: 'manager@example.com' },
    });

    if (!managerExists) {
      const hashedPassword = await bcrypt.hash('Manager123!', 12);
      const manager = userRepo.create({
        email: 'manager@example.com',
        password: hashedPassword,
        firstName: 'Manager',
        lastName: 'User',
        role: UserRole.MANAGER,
        organizationId: organization.id,
        isActive: true,
        isEmailVerified: true,
      });
      await userRepo.save(manager);
      console.log('✅ Created manager user: manager@example.com / Manager123!');
    } else {
      console.log('ℹ️  Manager user already exists');
    }

    // Create creator user
    const creatorExists = await userRepo.findOne({
      where: { email: 'creator@example.com' },
    });

    if (!creatorExists) {
      const hashedPassword = await bcrypt.hash('Creator123!', 12);
      const creator = userRepo.create({
        email: 'creator@example.com',
        password: hashedPassword,
        firstName: 'Creator',
        lastName: 'User',
        role: UserRole.CREATOR,
        organizationId: organization.id,
        isActive: true,
        isEmailVerified: true,
      });
      await userRepo.save(creator);
      console.log('✅ Created creator user: creator@example.com / Creator123!');
    } else {
      console.log('ℹ️  Creator user already exists');
    }

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('👤 You can now login with:');
    console.log('   Admin:   admin@example.com / Admin123!');
    console.log('   Manager: manager@example.com / Manager123!');
    console.log('   Creator: creator@example.com / Creator123!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seed()
  .then(() => {
    console.log('✅ Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
