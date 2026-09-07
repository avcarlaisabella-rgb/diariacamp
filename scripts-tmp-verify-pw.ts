import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { id: 'usr_admin' } });
  if (!user) {
    console.log('Usuário usr_admin não encontrado!');
    return;
  }
  console.log('Registro atual:', {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    updatedAt: user.updatedAt,
    passwordHashPrefix: user.passwordHash.slice(0, 10),
  });

  const check123456 = await bcrypt.compare('123456', user.passwordHash);
  console.log('Confere com "123456"?', check123456);

  const exactEmailMatch = await prisma.user.findUnique({ where: { email: 'oficialrwoliveira@gmail.com' } });
  console.log('Busca por email exata encontrou usuário?', !!exactEmailMatch, exactEmailMatch?.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
