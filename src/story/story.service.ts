import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

  async editStory(id, body, userId) {
    const isThereSuchTitle = await this.prismaService.story.findUnique({
      where: { title: body.title },
    });
    if (isThereSuchTitle) {
      throw new BadRequestException(
        `The name of the story ${body.title} already EXISTS`,
      );
    }
    const story = await this.prismaService.story.findUnique({ where: { id } });
    if (!story) {
      throw new BadRequestException(`Story with the name ${id} was NOT found`);
    }
    if (story.authorId !== userId) {
      throw new ForbiddenException('You do not have rights to edit this story');
    }
    const changedStory = await this.prismaService.story.update({
      where: { id },
      data: body,
    });
    if (!changedStory) {
      throw new BadRequestException(
        'Story was not updated. Please try again later',
      );
    }
    return changedStory;
  }

  async deleteStory(id: string, userId: string) {
    const story = await this.prismaService.story.findUnique({ where: { id } });
    if (!story) {
      throw new BadRequestException(`Story with the name ${id} was NOT found`);
    }
    if (story.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have rights to delete this story',
      );
    }
    const deletedStory = await this.prismaService.story.delete({
      where: { id },
    });
    if (!deletedStory)
      throw new BadRequestException(
        `Story with the name ${id} was NOT deleted. Please, try again later`,
      );
    return { message: 'The story was deleted', deletedStory };
  }

  async getAllStories() {
    const allStories = await this.prismaService.story.findMany({
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            picture: true,
          },
        },
      },
    });

    return allStories;
  }
}
