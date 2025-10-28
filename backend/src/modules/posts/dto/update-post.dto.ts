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
import { PostStatus, PostPlatform } from '../entities/post.entity';

export class UpdatePostDto {
  @ApiProperty({ description: 'Post title', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiProperty({ description: 'Post content/text', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiProperty({
    description: 'Post status',
    enum: PostStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    description: 'Target platform',
    enum: PostPlatform,
    required: false,
  })
  @IsOptional()
  @IsEnum(PostPlatform)
  platform?: PostPlatform;

  @ApiProperty({
    description: 'Scheduled publish date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Post metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
