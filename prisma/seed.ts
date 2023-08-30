import { Prisma, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const userData = [
  {
    email: 'alex@gmail.com',
    password: 'asfq3r1fqaf',
    role: Role.ADMIN,
  },
  {
    email: 'alex123rfw@gmail.com',
    password: 'asfq3fsadf32r1fqaf',
    role: Role.ADMIN,
  },
];
