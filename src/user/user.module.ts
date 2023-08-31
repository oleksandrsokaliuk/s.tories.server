import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleStrategy } from './authStrategy/google.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class UserModule {}
