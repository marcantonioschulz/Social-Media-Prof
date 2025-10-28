import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Asset } from './asset.entity';

export enum LicenseType {
  OWNED = 'owned',
  LICENSED = 'licensed',
  CREATIVE_COMMONS = 'creative_commons',
  PUBLIC_DOMAIN = 'public_domain',
  ROYALTY_FREE = 'royalty_free',
  RIGHTS_MANAGED = 'rights_managed',
  OTHER = 'other',
}

@Entity('licenses')
export class License extends BaseEntity {
  @ApiProperty({ description: 'License type', enum: LicenseType })
  @Column({
    type: 'enum',
    enum: LicenseType,
  })
  type: LicenseType;

  @ApiProperty({ description: 'License holder/owner name' })
  @Column({ type: 'varchar', length: 255 })
  holder: string;

  @ApiProperty({ description: 'License provider (e.g., Getty Images, Shutterstock)', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  provider: string;

  @ApiProperty({ description: 'License number/ID', required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  licenseNumber: string;

  @ApiProperty({ description: 'License start date', required: false })
  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  @ApiProperty({ description: 'License expiration date', required: false })
  @Column({ type: 'date', nullable: true })
  expirationDate: Date | null;

  @ApiProperty({ description: 'Usage rights description' })
  @Column({ type: 'text' })
  usageRights: string;

  @ApiProperty({ description: 'Usage restrictions', required: false })
  @Column({ type: 'text', nullable: true })
  restrictions: string;

  @ApiProperty({ description: 'License terms and conditions' })
  @Column({ type: 'text' })
  terms: string;

  @ApiProperty({ description: 'License document URL', required: false })
  @Column({ type: 'varchar', length: 1000, nullable: true })
  documentUrl: string;

  @ApiProperty({ description: 'License cost/price', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Asset relationship
  @ApiProperty({ description: 'Asset ID this license belongs to' })
  @Column({ type: 'uuid' })
  assetId: string;

  @ApiProperty({ type: () => Asset, description: 'Asset this license belongs to' })
  @OneToOne(() => Asset, (asset) => asset.license)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;
}
