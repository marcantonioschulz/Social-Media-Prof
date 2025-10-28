import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { Asset } from '../../assets/entities/asset.entity';
import { ApprovalWorkflow } from '../../approvals/entities/approval-workflow.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum PostPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  OTHER = 'other',
}

@Entity('posts')
export class Post extends BaseEntity {
  @ApiProperty({ description: 'Post title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Post content/text' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Post status', enum: PostStatus })
  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @ApiProperty({ description: 'Target platform', enum: PostPlatform })
  @Column({
    type: 'enum',
    enum: PostPlatform,
  })
  platform: PostPlatform;

  @ApiProperty({ description: 'Scheduled publish date', required: false })
  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @ApiProperty({ description: 'Actual publish date', required: false })
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ description: 'Post metadata (hashtags, mentions, etc.)', required: false })
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Multi-Tenant
  @ApiProperty({ description: 'Organization ID (tenant)' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ type: () => Organization, description: 'Post organization' })
  @ManyToOne(() => Organization, (organization) => organization.posts)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Creator
  @ApiProperty({ description: 'User who created this post' })
  @Column({ type: 'uuid' })
  createdById: string;

  @ApiProperty({ type: () => User, description: 'Post creator' })
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  // Relationships
  @ApiProperty({ type: () => [Asset], description: 'Assets attached to this post' })
  @OneToMany(() => Asset, (asset) => asset.post)
  assets: Asset[];

  @ApiProperty({
    type: () => ApprovalWorkflow,
    description: 'Approval workflow for this post',
    required: false,
  })
  @OneToOne(() => ApprovalWorkflow, (workflow) => workflow.post)
  approvalWorkflow: ApprovalWorkflow;
}
