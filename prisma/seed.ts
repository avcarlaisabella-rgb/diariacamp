import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { INITIAL_USERS, INITIAL_WORKERS, getInitialDiarias, INITIAL_FINANCIAL_PAYMENTS } from '../src/data/mockData';
import { DEFAULT_ROLE_RATES } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  for (const user of INITIAL_USERS) {
    const passwordHash = await bcrypt.hash(user.password || '123', 10);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash,
        role: user.role,
        avatar: user.avatar,
        teamZone: user.teamZone,
        phone: user.phone,
        active: user.active,
        managerId: user.managerId,
        managerName: user.managerName,
      },
    });
  }
  console.log(`  users: ${INITIAL_USERS.length}`);

  for (const [name, defaultRate] of Object.entries(DEFAULT_ROLE_RATES)) {
    await prisma.workerRoleType.upsert({
      where: { name },
      update: {},
      create: { name, defaultRate },
    });
  }
  console.log(`  worker role types: ${Object.keys(DEFAULT_ROLE_RATES).length}`);

  for (const worker of INITIAL_WORKERS) {
    await prisma.worker.upsert({
      where: { id: worker.id },
      update: {},
      create: { ...worker },
    });
  }
  console.log(`  workers: ${INITIAL_WORKERS.length}`);

  const diarias = getInitialDiarias();
  for (const d of diarias) {
    await prisma.dailyRecord.upsert({
      where: { id: d.id },
      update: {},
      create: { ...d, auditLog: (d.auditLog as unknown as object) ?? [] },
    });
  }
  console.log(`  diarias: ${diarias.length}`);

  for (const p of INITIAL_FINANCIAL_PAYMENTS) {
    await prisma.financialPayment.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, diariaIds: (p.diariaIds as unknown as object) ?? [] },
    });
  }
  console.log(`  financial payments: ${INITIAL_FINANCIAL_PAYMENTS.length}`);

  console.log('Seed concluído. Senha padrão de todos os usuários: 123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
