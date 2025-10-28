import { IsString, IsNotEmpty, IsOptional, IsUrl, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  slug: string;

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

  @ApiProperty({
    example: { approvalRequired: true, maxStorageGB: 100 },
    required: false,
    description: 'Organization-specific settings',
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
