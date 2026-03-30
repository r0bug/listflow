import { PrismaClient, UserRole } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default location
  const location = await prisma.location.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      id: 'loc_headquarters',
      name: 'Headquarters',
      code: 'HQ',
      address: '123 Main St',
      timezone: 'America/New_York',
      isActive: true,
    },
  });
  console.log('Created location:', location.name);

  // Hash passwords/PINs
  const adminPin = await bcrypt.hash('6809', 10);
  const defaultPin = await bcrypt.hash('1502', 10);

  // Create master admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@listflow.local' },
    update: { role: UserRole.ADMIN, name: 'bossman', password: adminPin },
    create: {
      id: 'user_admin',
      email: 'admin@listflow.local',
      name: 'bossman',
      role: UserRole.ADMIN,
      password: adminPin,
      locationId: location.id,
    },
  });
  console.log('Created user:', admin.name, '(ADMIN)');

  // Create default regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@listflow.local' },
    update: { role: UserRole.USER, password: defaultPin },
    create: {
      id: 'user_default',
      email: 'user@listflow.local',
      name: 'User',
      role: UserRole.USER,
      password: defaultPin,
      locationId: location.id,
    },
  });
  console.log('Created user:', user.name, '(USER) - PIN: 1502');

  console.log('\nDatabase seeded successfully!');
  console.log('\nDefault users:');
  console.log('  - bossman (admin@listflow.local)');
  console.log('  - User (user@listflow.local) - PIN: 1502');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
