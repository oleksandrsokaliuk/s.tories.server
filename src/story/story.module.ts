import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserInterceptor } from 'src/interceptors/user.interceptor';

@Module({
  imports: [PrismaModule],
  providers: [StoryService],
  controllers: [StoryController],
})
export class StoryModule {}
