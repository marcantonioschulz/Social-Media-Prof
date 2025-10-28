import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all audit logs with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated audit logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() queryDto: QueryAuditLogsDto, @Request() req) {
    // Super admins can see all audit logs, others only their organization
    const organizationId = req.user.role === UserRole.SUPER_ADMIN
      ? queryDto.organizationId
      : req.user.organizationId;

    // Override organizationId in query for non-super admins
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      queryDto.organizationId = req.user.organizationId;
    }

    return this.auditService.findAll(queryDto, organizationId);
  }

  @Get('recent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get recent activity for the organization' })
  @ApiResponse({ status: 200, description: 'Returns recent audit logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentActivity(@Query('limit') limit: string, @Request() req) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.auditService.getRecentActivity(req.user.organizationId, limitNum);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get activity summary for the organization' })
  @ApiResponse({ status: 200, description: 'Returns activity summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getActivitySummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditService.getActivitySummary(req.user.organizationId, start, end);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  @ApiResponse({ status: 200, description: 'Returns audit logs for the entity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Request() req,
  ) {
    // Super admins can see all, others only their organization
    const organizationId = req.user.role === UserRole.SUPER_ADMIN
      ? undefined
      : req.user.organizationId;

    return this.auditService.findByEntity(entityType, entityId, organizationId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Returns the audit log' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    // Super admins can see all, others only their organization
    const organizationId = req.user.role === UserRole.SUPER_ADMIN
      ? undefined
      : req.user.organizationId;

    return this.auditService.findOne(id, organizationId);
  }
}
