import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoryModule } from './story/story.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserInterceptor } from './interceptors/user.interceptor';

@Module({
  imports: [UserModule, PrismaModule, StoryModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserInterceptor,
    },
  ],
})
export class AppModule {}
