import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class StoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
