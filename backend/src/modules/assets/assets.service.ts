import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  async upload(
    file: Express.Multer.File,
    createAssetDto: CreateAssetDto,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Asset> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 100MB limit');
    }

    // Upload file to MinIO
    const uploadResult = await this.storageService.uploadFile(
      file,
      organizationId,
      'assets',
    );

    // Create asset entity
    const asset = this.assetRepository.create({
      type: createAssetDto.type,
      originalName: file.originalname,
      fileName: uploadResult.fileName,
      filePath: uploadResult.filePath,
      fileUrl: uploadResult.fileUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum: uploadResult.checksum,
      description: createAssetDto.description,
      organizationId,
      postId: createAssetDto.postId || null,
    });

    const savedAsset = await this.assetRepository.save(asset);

    // Audit log
    await this.auditService.log({
      action: AuditAction.ASSET_UPLOADED,
      entityType: 'Asset',
      entityId: savedAsset.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: {
        fileName: savedAsset.originalName,
        fileSize: savedAsset.fileSize,
        mimeType: savedAsset.mimeType,
      },
      newValues: savedAsset,
    });

    return savedAsset;
  }

  async findAll(organizationId: string, postId?: string): Promise<Asset[]> {
    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.organizationId = :organizationId', { organizationId })
      .orderBy('asset.createdAt', 'DESC');

    if (postId) {
      queryBuilder.andWhere('asset.postId = :postId', { postId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, organizationId: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id, organizationId },
      relations: ['post', 'license'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async attachToPost(
    assetId: string,
    postId: string,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Asset> {
    const asset = await this.findOne(assetId, organizationId);

    asset.postId = postId;
    const updatedAsset = await this.assetRepository.save(asset);

    // Audit log
    await this.auditService.log({
      action: AuditAction.ASSET_UPLOADED,
      entityType: 'Asset',
      entityId: updatedAsset.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: { postId, action: 'attached_to_post' },
    });

    return updatedAsset;
  }

  async remove(
    id: string,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const asset = await this.findOne(id, organizationId);

    // Delete file from storage
    try {
      await this.storageService.deleteFile(asset.filePath);
    } catch (error) {
      // Log but don't fail if file deletion fails
      console.error(`Failed to delete file from storage: ${error.message}`);
    }

    await this.assetRepository.softRemove(asset);

    // Audit log
    await this.auditService.log({
      action: AuditAction.ASSET_DELETED,
      entityType: 'Asset',
      entityId: id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: { fileName: asset.originalName },
      oldValues: asset,
    });
  }

  async refreshUrl(id: string, organizationId: string): Promise<Asset> {
    const asset = await this.findOne(id, organizationId);

    // Generate new presigned URL
    const newUrl = await this.storageService.getFileUrl(asset.filePath);
    asset.fileUrl = newUrl;

    return this.assetRepository.save(asset);
  }
}
