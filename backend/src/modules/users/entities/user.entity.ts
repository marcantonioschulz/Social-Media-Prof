import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Post } from '../../posts/entities/post.entity';
import { ApprovalStep } from '../../approvals/entities/approval-step.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  MANAGER = 'manager',
  CREATOR = 'creator',
  VIEWER = 'viewer',
}

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ description: 'User email address' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ description: 'User password hash' })
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiProperty({ description: 'User first name' })
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  @ApiProperty({ description: 'Is user active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ description: 'Email verification status' })
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  // Organization relationship (Multi-Tenant)
  @ApiProperty({ description: 'Organization ID (tenant)' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ type: () => Organization, description: 'User organization' })
  @ManyToOne(() => Organization, (organization) => organization.users)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Relationships
  @ApiProperty({ type: () => [Post], description: 'Posts created by this user' })
  @OneToMany(() => Post, (post) => post.createdBy)
  posts: Post[];

  @ApiProperty({
    type: () => [ApprovalStep],
    description: 'Approval steps assigned to this user',
  })
  @OneToMany(() => ApprovalStep, (step) => step.approver)
  approvalSteps: ApprovalStep[];

  @ApiProperty({ type: () => [AuditLog], description: 'Audit logs created by this user' })
  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];
}
