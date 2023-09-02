import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface EndpointReturnI {
  message: string;
  responseObject: any;
}

@Injectable()
export class StoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async createStory(body, userId: string): Promise<EndpointReturnI> {
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
    return {
      message: `The story with the name ${body.title} was CREATED successfully`,
      responseObject: story,
    };
  }

  async editStory(id, body, userId): Promise<EndpointReturnI> {
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
    return {
      message: `The story with the name ${body.title} was EDITED successfully`,
      responseObject: changedStory,
    };
  }

  async deleteStory(id: string, userId: string): Promise<EndpointReturnI> {
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
        `Story with the id ${id} was NOT deleted. Please, try again later`,
      );
    return { message: 'The story was deleted', responseObject: deletedStory };
  }

  async getAllStories(): Promise<EndpointReturnI> {
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
    return {
      message: 'The stories were successfully obtained',
      responseObject: allStories,
    };
  }

  async getStoryByStoryId(id: string): Promise<EndpointReturnI> {
    const story = await this.prismaService.story.findUnique({
      where: { id },
    });
    if (!story) {
      throw new BadRequestException(`Story with the id ${id} was NOT found`);
    }
    return { message: 'The story was found', responseObject: story };
  }

  async getStoriesByUserId(id, userId?): Promise<EndpointReturnI> {
    if (userId && userId === id) {
      const UNpublishedStories = await this.prismaService.story.findMany({
        where: { authorId: id },
      });
      if (!UNpublishedStories) {
        throw new BadRequestException(
          `The user with the id ${id} has no stroies yet`,
        );
      }
      return {
        message: 'The UNpublished stories were found',
        responseObject: UNpublishedStories,
      };
    }
    const publishedStories = await this.prismaService.story.findMany({
      where: { authorId: id, published: true },
    });
    if (!publishedStories) {
      throw new BadRequestException(
        `The user with the id ${id} has no stroies yet`,
      );
    }
    return {
      message: 'The published stories were found',
      responseObject: publishedStories,
    };
  }

  async likeByStoryId(storyId, userId): Promise<EndpointReturnI> {
    const checkIsLiked = await this.prismaService.story.findUnique({
      where: { id: storyId },
      include: { likes: true },
    });
    const isStoryAlreadyLikedByUser = () => {
      let isAlreadyLiked = false;
      checkIsLiked.likes.forEach((like) =>
        like.userId === userId ? (isAlreadyLiked = true) : null,
      );
      return isAlreadyLiked;
    };
    if (isStoryAlreadyLikedByUser()) {
      throw new BadRequestException(
        `You have already liked the story with id ${storyId}`,
      );
    }
    const like = await this.prismaService.likes.create({
      data: {
        storyId,
        userId,
      },
    });
    if (!like) {
      throw new BadRequestException(
        `Like to story with id ${storyId} was NOT successfull. Please, try again later`,
      );
    }
    const story = await this.prismaService.story.findUnique({
      where: { id: storyId },
      include: { likes: true },
    });
    if (!story) {
      throw new BadRequestException(
        `Story with the name ${storyId} was NOT found`,
      );
    }
    return {
      message: 'You liked the story successfully',
      responseObject: story,
    };
  }

  async getMyLikes(userId): Promise<EndpointReturnI> {
    const myLikes = await this.prismaService.likes.findMany({
      where: { userId },
      include: {
        story: true,
        user: true,
      },
    });
    if (!myLikes) {
      throw new BadRequestException(`The user ${userId} has NO likes yet`);
    }
    return {
      message: 'You liked the following stories',
      responseObject: myLikes,
    };
  }
}
