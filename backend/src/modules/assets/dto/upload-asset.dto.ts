import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { AssetType } from '../entities/asset.entity';

export class UploadAssetDto {
  @ApiProperty({ description: 'Asset type', enum: AssetType, example: AssetType.IMAGE })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiProperty({ description: 'Asset description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Post ID to attach asset to', required: false })
  @IsOptional()
  @IsUUID()
  postId?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: any;
}
