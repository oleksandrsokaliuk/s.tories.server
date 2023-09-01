import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StoryService],
  controllers: [StoryController],
})
export class StoryModule {}
