import { Injectable } from '@nestjs/common';
import prisma from 'prisma/prisma';
import { userData } from 'prisma/seed';

@Injectable()
export class AppService {
  getHello = async () => {
    const allUsers = await prisma.user.create({
      data: userData[0],
    });
  };
}
