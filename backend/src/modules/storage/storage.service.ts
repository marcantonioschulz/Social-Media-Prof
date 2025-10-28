import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

export interface UploadFileResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
  etag: string;
  checksum: string;
  size: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    // Initialize MinIO client
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });

    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'social-media-compliance');
    this.region = this.configService.get<string>('MINIO_REGION', 'us-east-1');
  }

  /**
   * Initialize bucket on module init
   */
  async onModuleInit() {
    try {
      await this.ensureBucketExists();
      this.logger.log(`MinIO initialized. Bucket: ${this.bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to initialize MinIO: ${error.message}`, error.stack);
    }
  }

  /**
   * Ensure the bucket exists, create it if it doesn't
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);

      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, this.region);
        this.logger.log(`Created bucket: ${this.bucketName}`);

        // Set bucket policy to allow read access (adjust as needed for your security requirements)
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };

        try {
          await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
          this.logger.log(`Set bucket policy for: ${this.bucketName}`);
        } catch (policyError) {
          this.logger.warn(`Could not set bucket policy: ${policyError.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error ensuring bucket exists: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    organizationId: string,
    folder: string = 'uploads',
  ): Promise<UploadFileResult> {
    try {
      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;

      // Build object path with organization and folder
      const filePath = `${organizationId}/${folder}/${uniqueFileName}`;

      // Calculate checksum
      const checksum = createHash('sha256').update(file.buffer).digest('hex');

      // Upload file to MinIO
      const result = await this.minioClient.putObject(
        this.bucketName,
        filePath,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'Original-Name': file.originalname,
          'X-Checksum': checksum,
        },
      );

      // Get file URL
      const fileUrl = await this.getFileUrl(filePath);

      this.logger.log(`File uploaded successfully: ${filePath}`);

      return {
        fileName: uniqueFileName,
        filePath,
        fileUrl,
        etag: result.etag,
        checksum,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get presigned URL for file access (valid for 7 days by default)
   */
  async getFileUrl(filePath: string, expirySeconds: number = 604800): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        filePath,
        expirySeconds,
      );
      return url;
    } catch (error) {
      this.logger.error(`Error getting file URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.minioClient.statObject(this.bucketName, filePath);
    } catch (error) {
      this.logger.error(`Error getting file metadata: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, filePath);
      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete multiple files from MinIO
   */
  async deleteFiles(filePaths: string[]): Promise<void> {
    try {
      await this.minioClient.removeObjects(this.bucketName, filePaths);
      this.logger.log(`${filePaths.length} files deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting files: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * List files in a folder (organization or specific path)
   */
  async listFiles(prefix: string): Promise<Minio.BucketItem[]> {
    try {
      const stream = this.minioClient.listObjects(this.bucketName, prefix, true);
      const files: Minio.BucketItem[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => files.push(obj));
        stream.on('end', () => resolve(files));
        stream.on('error', (error) => reject(error));
      });
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Copy file to a new location
   */
  async copyFile(sourceFilePath: string, destinationFilePath: string): Promise<void> {
    try {
      const conds = new Minio.CopyConditions();
      await this.minioClient.copyObject(
        this.bucketName,
        destinationFilePath,
        `/${this.bucketName}/${sourceFilePath}`,
        conds,
      );
      this.logger.log(`File copied: ${sourceFilePath} -> ${destinationFilePath}`);
    } catch (error) {
      this.logger.error(`Error copying file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get storage usage for an organization
   */
  async getOrganizationStorageUsage(organizationId: string): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    try {
      const files = await this.listFiles(organizationId);

      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

      return {
        totalFiles: files.length,
        totalSize,
      };
    } catch (error) {
      this.logger.error(`Error getting storage usage: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, filePath);
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      this.logger.error(`Error checking file existence: ${error.message}`);
      return false;
    }
  }
}
