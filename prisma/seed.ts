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

  // Hash the PIN (1111)
  const hashedPin = await bcrypt.hash('1111', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@listflow.local' },
    update: {},
    create: {
      id: 'user_admin',
      email: 'admin@listflow.local',
      name: 'Admin User',
      role: UserRole.ADMIN,
      password: hashedPin,
      locationId: location.id,
    },
  });
  console.log('Created user:', admin.name, '- PIN: 1111');

  // Create additional users
  const processor = await prisma.user.upsert({
    where: { email: 'processor@listflow.local' },
    update: {},
    create: {
      id: 'user_processor',
      email: 'processor@listflow.local',
      name: 'Processor User',
      role: UserRole.PROCESSOR,
      password: hashedPin,
      locationId: location.id,
    },
  });
  console.log('Created user:', processor.name, '- PIN: 1111');

  const photographer = await prisma.user.upsert({
    where: { email: 'photo@listflow.local' },
    update: {},
    create: {
      id: 'user_photographer',
      email: 'photo@listflow.local',
      name: 'Photographer',
      role: UserRole.PHOTOGRAPHER,
      password: hashedPin,
      locationId: location.id,
    },
  });
  console.log('Created user:', photographer.name, '- PIN: 1111');

  // Provision the two eBay seller accounts (creds shared from the one dev app;
  // per-account user tokens arrive via the OAuth Connect flow in Settings).
  // Names/emails are placeholders until real ones are set via env or Settings.
  const ebayAccounts = [
    {
      accountName: process.env.EBAY_ACCOUNT_1_NAME || 'account-1',
      email: process.env.EBAY_ACCOUNT_1_EMAIL || 'account1@placeholder.local',
    },
    {
      accountName: process.env.EBAY_ACCOUNT_2_NAME || 'account-2',
      email: process.env.EBAY_ACCOUNT_2_EMAIL || 'account2@placeholder.local',
    },
  ];
  for (const acct of ebayAccounts) {
    const created = await prisma.ebayAccount.upsert({
      where: { accountName: acct.accountName },
      update: {},
      create: {
        accountName: acct.accountName,
        email: acct.email,
        appId: process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID || '',
        certId: process.env.EBAY_CLIENT_SECRET || process.env.EBAY_CERT_ID || '',
        devId: process.env.EBAY_DEV_ID || '',
        sandbox: process.env.EBAY_SANDBOX === 'true',
        locationId: location.id,
      },
    });
    console.log('Created eBay account:', created.accountName);
  }

  console.log('\nDatabase seeded successfully!');
  console.log('\nDefault users created:');
  console.log('  - Admin User (admin@listflow.local) - PIN: 1111');
  console.log('  - Processor User (processor@listflow.local) - PIN: 1111');
  console.log('  - Photographer (photo@listflow.local) - PIN: 1111');
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
