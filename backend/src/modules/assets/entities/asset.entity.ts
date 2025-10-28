import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Post } from '../../posts/entities/post.entity';
import { License } from './license.entity';

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  DOCUMENT = 'document',
}

@Entity('assets')
export class Asset extends BaseEntity {
  @ApiProperty({ description: 'Asset type', enum: AssetType })
  @Column({
    type: 'enum',
    enum: AssetType,
  })
  type: AssetType;

  @ApiProperty({ description: 'Original file name' })
  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @ApiProperty({ description: 'File name in storage' })
  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @ApiProperty({ description: 'File path in storage' })
  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  @ApiProperty({ description: 'File URL for access' })
  @Column({ type: 'varchar', length: 1000 })
  fileUrl: string;

  @ApiProperty({ description: 'MIME type' })
  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column({ type: 'bigint' })
  fileSize: number;

  @ApiProperty({ description: 'File checksum (SHA256)' })
  @Column({ type: 'varchar', length: 64 })
  checksum: string;

  @ApiProperty({ description: 'Asset description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Asset metadata (dimensions, duration, etc.)', required: false })
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Multi-Tenant
  @ApiProperty({ description: 'Organization ID (tenant)' })
  @Column({ type: 'uuid' })
  organizationId: string;

  @ApiProperty({ type: () => Organization, description: 'Asset organization' })
  @ManyToOne(() => Organization, (organization) => organization.assets)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Post relationship
  @ApiProperty({ description: 'Post ID this asset belongs to', required: false })
  @Column({ type: 'uuid', nullable: true })
  postId: string | null;

  @ApiProperty({ type: () => Post, description: 'Post this asset belongs to', required: false })
  @ManyToOne(() => Post, (post) => post.assets, { nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Post | null;

  // License information
  @ApiProperty({
    type: () => License,
    description: 'License information for this asset',
    required: false,
  })
  @OneToOne(() => License, (license) => license.asset, { nullable: true })
  license: License | null;
}
