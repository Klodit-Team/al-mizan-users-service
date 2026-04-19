import { PrismaClient, RoleName } from '@prisma/client';

/**
 * Database Seed File
 *
 * This file populates the Users Service database with initial data.
 *
 * RabbitMQ Integration Notes:
 * ===========================
 * The Users Service consumes events from the Authentication Service via RabbitMQ.
 * When a user registers in the Auth Service, it publishes a 'user.registered' event
 * with the following structure:
 *
 * {
 *   "event_id": "uuid",
 *   "user_id": "uuid (from auth service)",
 *   "email": "user@example.com",
 *   "timestamp": "2026-03-30T15:49:00Z"
 * }
 *
 * The Users Service listens for these events via:
 * - Service: AuthEventsListener (src/rabbitmq/auth-events.listener.ts)
 * - Queue: users-service.user.registered
 * - Handler: UserRegisteredHandler
 *
 * Configuration:
 * - RABBITMQ_URL=amqp://guest:guest@localhost:5673
 * - RABBITMQ_EXCHANGE=al-mizan.events
 *
 * The sample user IDs in this seed file simulate users that would have been
 * registered via the Auth Service.
 */

const prisma = new PrismaClient();

const SEEDED_IDS = {
  users: {
    admin: '11111111-1111-1111-1111-111111111111',
    serviceContractant: '22222222-2222-2222-2222-222222222222',
    operateurEconomique: '33333333-3333-3333-3333-333333333333',
    controleur: '44444444-4444-4444-4444-444444444444',
  },
  organisations: {
    ministereFinances: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sarlBatipro: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  },
  profiles: {
    admin: 'aaaaaaaa-1111-1111-1111-111111111111',
    serviceContractant: 'bbbbbbbb-2222-2222-2222-222222222222',
    operateurEconomique: 'cccccccc-3333-3333-3333-333333333333',
    controleur: 'dddddddd-4444-4444-4444-444444444444',
  },
  serviceContractant: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  operateurEconomique: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
};

async function main(): Promise<void> {
  const defaultRoles: Array<{ name: RoleName; description: string }> = [
    { name: RoleName.ADMIN, description: 'Administration complete de la plateforme' },
    {
      name: RoleName.SERVICE_CONTRACTANT,
      description: 'Gestion des appels d offres et attributions',
    },
    {
      name: RoleName.OPERATEUR_ECONOMIQUE,
      description: 'Soumission des offres et suivi des dossiers',
    },
    {
      name: RoleName.MEMBRE_COMMISSION,
      description: 'Participation aux commissions du marche/evaluation',
    },
    {
      name: RoleName.CONTROLEUR,
      description: 'Controle des procedures et decisions',
    },
  ];

  for (const role of defaultRoles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  const roles = await prisma.role.findMany();
  const roleByName = new Map(roles.map((role) => [role.name, role.id]));

  await prisma.organisation.upsert({
    where: { id: SEEDED_IDS.organisations.ministereFinances },
    update: {
      denomination: 'Ministere des Finances',
      nif: '000000000001',
      nis: '000000000001000',
      registreCommerce: null,
      adresse: 'Alger Centre',
      wilaya: 'Alger',
      commune: 'Sidi Mhamed',
      telephone: '021000001',
      email: 'sc@al-mizan.dz',
      type: 'MINISTERE',
      isVerified: true,
    },
    create: {
      id: SEEDED_IDS.organisations.ministereFinances,
      denomination: 'Ministere des Finances',
      nif: '000000000001',
      nis: '000000000001000',
      registreCommerce: null,
      adresse: 'Alger Centre',
      wilaya: 'Alger',
      commune: 'Sidi Mhamed',
      telephone: '021000001',
      email: 'sc@al-mizan.dz',
      type: 'MINISTERE',
      isVerified: true,
    },
  });

  await prisma.organisation.upsert({
    where: { id: SEEDED_IDS.organisations.sarlBatipro },
    update: {
      denomination: 'SARL Batipro',
      nif: '000000000002',
      nis: '000000000002000',
      registreCommerce: 'RC-16-2026-B-001',
      adresse: 'Zone Industrielle Rouiba',
      wilaya: 'Alger',
      commune: 'Rouiba',
      telephone: '021000002',
      email: 'oe@batipro.dz',
      type: 'ENTREPRISE_PRIVEE',
      isVerified: true,
    },
    create: {
      id: SEEDED_IDS.organisations.sarlBatipro,
      denomination: 'SARL Batipro',
      nif: '000000000002',
      nis: '000000000002000',
      registreCommerce: 'RC-16-2026-B-001',
      adresse: 'Zone Industrielle Rouiba',
      wilaya: 'Alger',
      commune: 'Rouiba',
      telephone: '021000002',
      email: 'oe@batipro.dz',
      type: 'ENTREPRISE_PRIVEE',
      isVerified: true,
    },
  });

  await prisma.profile.upsert({
    where: { userId: SEEDED_IDS.users.admin },
    update: {
      nom: 'Admin',
      prenom: 'Systeme',
      telephone: '0555000001',
      langue: 'fr',
    },
    create: {
      id: SEEDED_IDS.profiles.admin,
      userId: SEEDED_IDS.users.admin,
      nom: 'Admin',
      prenom: 'Systeme',
      telephone: '0555000001',
      langue: 'fr',
    },
  });

  await prisma.profile.upsert({
    where: { userId: SEEDED_IDS.users.serviceContractant },
    update: {
      nom: 'Benali',
      prenom: 'Karim',
      telephone: '0555000002',
      langue: 'fr',
    },
    create: {
      id: SEEDED_IDS.profiles.serviceContractant,
      userId: SEEDED_IDS.users.serviceContractant,
      nom: 'Benali',
      prenom: 'Karim',
      telephone: '0555000002',
      langue: 'fr',
    },
  });

  await prisma.profile.upsert({
    where: { userId: SEEDED_IDS.users.operateurEconomique },
    update: {
      nom: 'Said',
      prenom: 'Yasmine',
      telephone: '0555000003',
      langue: 'fr',
    },
    create: {
      id: SEEDED_IDS.profiles.operateurEconomique,
      userId: SEEDED_IDS.users.operateurEconomique,
      nom: 'Said',
      prenom: 'Yasmine',
      telephone: '0555000003',
      langue: 'fr',
    },
  });

  await prisma.profile.upsert({
    where: { userId: SEEDED_IDS.users.controleur },
    update: {
      nom: 'Kaci',
      prenom: 'Nadir',
      telephone: '0555000004',
      langue: 'fr',
    },
    create: {
      id: SEEDED_IDS.profiles.controleur,
      userId: SEEDED_IDS.users.controleur,
      nom: 'Kaci',
      prenom: 'Nadir',
      telephone: '0555000004',
      langue: 'fr',
    },
  });

  await prisma.serviceContractant.upsert({
    where: { id: SEEDED_IDS.serviceContractant },
    update: {
      organisationId: SEEDED_IDS.organisations.ministereFinances,
      userId: SEEDED_IDS.users.serviceContractant,
      codeService: 'SC-MF-001',
      secteurActivite: 'Finances Publiques',
      ordonateur: 'Directeur des Marches',
    },
    create: {
      id: SEEDED_IDS.serviceContractant,
      organisationId: SEEDED_IDS.organisations.ministereFinances,
      userId: SEEDED_IDS.users.serviceContractant,
      codeService: 'SC-MF-001',
      secteurActivite: 'Finances Publiques',
      ordonateur: 'Directeur des Marches',
    },
  });

  await prisma.operateurEconomique.upsert({
    where: { id: SEEDED_IDS.operateurEconomique },
    update: {
      organisationId: SEEDED_IDS.organisations.sarlBatipro,
      userId: SEEDED_IDS.users.operateurEconomique,
      qualifications: 'Travaux publics, Genie civil, Batiment',
      categories: 'A,B',
      isEligible: true,
      isBlacklisted: false,
      raisonBlacklist: null,
    },
    create: {
      id: SEEDED_IDS.operateurEconomique,
      organisationId: SEEDED_IDS.organisations.sarlBatipro,
      userId: SEEDED_IDS.users.operateurEconomique,
      qualifications: 'Travaux publics, Genie civil, Batiment',
      categories: 'A,B',
      isEligible: true,
      isBlacklisted: false,
      raisonBlacklist: null,
    },
  });

  const requiredRoles: Array<{ userId: string; roleName: RoleName }> = [
    { userId: SEEDED_IDS.users.admin, roleName: RoleName.ADMIN },
    {
      userId: SEEDED_IDS.users.serviceContractant,
      roleName: RoleName.SERVICE_CONTRACTANT,
    },
    {
      userId: SEEDED_IDS.users.operateurEconomique,
      roleName: RoleName.OPERATEUR_ECONOMIQUE,
    },
    { userId: SEEDED_IDS.users.controleur, roleName: RoleName.CONTROLEUR },
  ];

  for (const item of requiredRoles) {
    const roleId = roleByName.get(item.roleName);
    if (!roleId) {
      throw new Error(`Role ${item.roleName} not found after role seeding`);
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: item.userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId: item.userId,
        roleId,
      },
    });
  }

  console.log(
    `Seed complete: ${defaultRoles.length} roles, 2 organisations, 4 profiles, 1 service contractant, 1 operateur economique, 4 user-role assignments upserted.`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
