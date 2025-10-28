import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { Asset } from '../../assets/entities/asset.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @ApiProperty({ description: 'Organization name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Organization slug (unique identifier in URLs)' })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @ApiProperty({ description: 'Organization description', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Organization logo URL', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string;

  @ApiProperty({ description: 'Organization website', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @ApiProperty({ description: 'Is organization active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Organization settings (JSON)' })
  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  // Relationships
  @ApiProperty({ type: () => [User], description: 'Users in this organization' })
  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @ApiProperty({ type: () => [Post], description: 'Posts created by this organization' })
  @OneToMany(() => Post, (post) => post.organization)
  posts: Post[];

  @ApiProperty({ type: () => [Asset], description: 'Assets owned by this organization' })
  @OneToMany(() => Asset, (asset) => asset.organization)
  assets: Asset[];
}
