import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { AssetType } from '../entities/asset.entity';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset type', enum: AssetType })
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
}
