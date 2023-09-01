import { Body, Controller, Post } from '@nestjs/common';
import { StoryDto } from './dtos/story.dto';
import { StoryService } from './story.service';
import User, { UserTypeI } from 'src/decorators/user.decorator';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}
  @Post('/create')
  createStory(@Body() body: StoryDto, @User() user: UserTypeI) {
    return this.storyService.createStory(body, user.id);
  }
}
