import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an audit event
   */
  async log(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create(createAuditLogDto);
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Error creating audit log: ${error.message}`, error.stack);
      // Don't throw - audit logging should not break the application
      return null;
    }
  }

  /**
   * Find all audit logs with filters and pagination
   */
  async findAll(
    queryDto: QueryAuditLogsDto,
    userOrganizationId?: string,
  ): Promise<PaginatedResult<AuditLog>> {
    const { page = 1, limit = 20, startDate, endDate, ...filters } = queryDto;

    // Build where clause
    const where: FindOptionsWhere<AuditLog> = {};

    // Apply filters
    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    // Multi-tenant isolation: Use organizationId from filters or user's organization
    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    } else if (userOrganizationId) {
      where.organizationId = userOrganizationId;
    }

    // Date range filter
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find audit log by ID with organization validation
   */
  async findOne(id: string, organizationId?: string): Promise<AuditLog | null> {
    const where: FindOptionsWhere<AuditLog> = { id };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.auditLogRepository.findOne({
      where,
      relations: ['user'],
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    organizationId?: string,
  ): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = {
      entityType,
      entityId,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.auditLogRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async findByUser(organizationId: string, userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        organizationId,
        userId,
      },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Get recent activity for an organization
   */
  async getRecentActivity(
    organizationId: string,
    limit: number = 10,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { organizationId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get activity summary for an organization
   */
  async getActivitySummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ action: string; count: number }[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit.organizationId = :organizationId', { organizationId })
      .groupBy('audit.action');

    if (startDate && endDate) {
      query.andWhere('audit.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getRawMany();
  }

  /**
   * Delete old audit logs (data retention)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
