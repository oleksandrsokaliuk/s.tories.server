import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoryModule } from './story/story.module';

@Module({
  imports: [UserModule, PrismaModule, StoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
