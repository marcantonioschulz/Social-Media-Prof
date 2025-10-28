import { IsEnum, IsString, IsUUID, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiProperty({ enum: AuditAction, example: AuditAction.POST_CREATED })
  @IsEnum(AuditAction)
  @IsNotEmpty()
  action: AuditAction;

  @ApiProperty({ example: 'post' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiProperty({ example: '192.168.1.1' })
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...' })
  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @ApiProperty({ example: { postTitle: 'My First Post' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ example: { status: 'draft' }, required: false })
  @IsObject()
  @IsOptional()
  oldValues?: Record<string, any>;

  @ApiProperty({ example: { status: 'published' }, required: false })
  @IsObject()
  @IsOptional()
  newValues?: Record<string, any>;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
