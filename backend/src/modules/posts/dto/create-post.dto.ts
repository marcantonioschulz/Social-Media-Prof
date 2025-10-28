import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PostPlatform } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ description: 'Post title', example: 'My awesome post' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Post content/text',
    example: 'This is the content of my post...',
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiProperty({
    description: 'Target platform',
    enum: PostPlatform,
    example: PostPlatform.INSTAGRAM,
  })
  @IsEnum(PostPlatform)
  platform: PostPlatform;

  @ApiProperty({
    description: 'Scheduled publish date',
    required: false,
    example: '2024-12-31T12:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Post metadata (hashtags, mentions, etc.)',
    required: false,
    example: { hashtags: ['social', 'media'], mentions: ['@user'] },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
