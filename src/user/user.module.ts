import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleStrategy } from './authStrategy/google.strategy';
import { HttpModule } from '@nestjs/axios';
import { FacebookStrategy } from './authStrategy/facebook.strategy';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, FacebookStrategy],
})
export class UserModule {}
