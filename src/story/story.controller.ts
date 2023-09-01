import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { EditStoryDto, StoryDto } from './dtos/story.dto';
import { StoryService } from './story.service';
import User, { UserTypeI } from 'src/decorators/user.decorator';
import { UserInterceptor } from 'src/interceptors/user.interceptor';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @UseInterceptors(UserInterceptor)
  @Post('/')
  createStory(@Body() body: StoryDto, @User() user: UserTypeI) {
    if (!user) {
      throw new UnauthorizedException('You have to authorize first');
    }
    return this.storyService.createStory(body, user.id);
  }

  @UseInterceptors(UserInterceptor)
  @Put('/:id')
  editStory(
    @Param('id') id: string,
    @Body() body: EditStoryDto,
    @User() user: UserTypeI,
  ) {
    if (!user) {
      throw new UnauthorizedException('You have to authorize first');
    }
    console.log({ user });
    return this.storyService.editStory(id, body, user.id);
  }

  @UseInterceptors(UserInterceptor)
  @Delete('/:id')
  deleteStory(@Param('id') id: string, @User() user: UserTypeI) {
    if (!user) {
      throw new UnauthorizedException('You have to authorize first');
    }
    return this.storyService.deleteStory(id, user.id);
  }

  @Get('/all')
  getAllStories() {
    return this.storyService.getAllStories();
  }
}
