import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async createStory(body, userId: string) {
    const storyExists = await this.prismaService.story.findUnique({
      where: { title: body.title },
    });

    if (storyExists) {
      throw new ConflictException(
        `Story with the name ${body.title} already exists`,
      );
    }

    const story = await this.prismaService.story.create({
      data: {
        title: body.title,
        content: body.content,
        published: body.published ? body.published : false,
        authorId: userId,
      },
    });

    if (!story) {
      throw new BadRequestException(
        `Story with the name ${body.title} was NOT created`,
      );
    }

    return story;
  }
}
