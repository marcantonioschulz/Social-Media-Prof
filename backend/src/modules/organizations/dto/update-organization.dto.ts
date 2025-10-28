import { IsString, IsOptional, IsUrl, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'acme-corp', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'Leading provider of innovative solutions', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: 'https://www.acme-corp.com', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: { approvalRequired: true, maxStorageGB: 100 },
    required: false,
    description: 'Organization-specific settings',
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
