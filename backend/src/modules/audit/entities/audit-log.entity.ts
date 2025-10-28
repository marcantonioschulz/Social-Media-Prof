import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',

  // Posts
  POST_CREATED = 'post_created',
  POST_UPDATED = 'post_updated',
  POST_DELETED = 'post_deleted',
  POST_PUBLISHED = 'post_published',
  POST_ARCHIVED = 'post_archived',

  // Assets
  ASSET_UPLOADED = 'asset_uploaded',
  ASSET_DELETED = 'asset_deleted',
  ASSET_ACCESSED = 'asset_accessed',

  // Approvals
  APPROVAL_REQUESTED = 'approval_requested',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',

  // Users
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',

  // Organizations
  ORGANIZATION_CREATED = 'organization_created',
  ORGANIZATION_UPDATED = 'organization_updated',
  ORGANIZATION_SETTINGS_CHANGED = 'organization_settings_changed',

  // Licenses
  LICENSE_ADDED = 'license_added',
  LICENSE_UPDATED = 'license_updated',
  LICENSE_EXPIRED = 'license_expired',

  // Export
  DATA_EXPORTED = 'data_exported',
}

@Entity('audit_logs')
@Index(['organizationId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog extends BaseEntity {
  @ApiProperty({ description: 'Action performed', enum: AuditAction })
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({ description: 'Entity type affected' })
  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @ApiProperty({ description: 'Entity ID affected', required: false })
  @Column({ type: 'uuid', nullable: true })
  entityId: string | null;

  @ApiProperty({ description: 'IP address of the user' })
  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @ApiProperty({ description: 'User agent string' })
  @Column({ type: 'varchar', length: 500 })
  userAgent: string;

  @ApiProperty({ description: 'Additional metadata about the action' })
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Old values before change', required: false })
  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any> | null;

  @ApiProperty({ description: 'New values after change', required: false })
  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null;

  // Multi-Tenant
  @ApiProperty({ description: 'Organization ID (tenant)' })
  @Column({ type: 'uuid' })
  organizationId: string;

  // User who performed the action
  @ApiProperty({ description: 'User ID who performed the action', required: false })
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ type: () => User, description: 'User who performed the action', required: false })
  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;
}
