import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request as RequestDecorator,
  HttpCode,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Organization already exists' })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({ status: 200, description: 'Returns all organizations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@RequestDecorator() req: Request) {
    // Super admins can see all organizations
    if ((req as any).user.role === UserRole.SUPER_ADMIN) {
      return this.organizationsService.findAll(true);
    }

    // Regular users can only see their own organization
    return [await this.organizationsService.findOne((req as any).user.organizationId)];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Returns the organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id') id: string, @RequestDecorator() req: Request) {
    // Ensure multi-tenant isolation (unless super admin)
    if ((req as any).user.role !== UserRole.SUPER_ADMIN && id !== (req as any).user.organizationId) {
      throw new ConflictException('Access denied');
    }

    return this.organizationsService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Returns organization statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getStatistics(@Param('id') id: string, @RequestDecorator() req: Request) {
    // Ensure multi-tenant isolation (unless super admin)
    if ((req as any).user.role !== UserRole.SUPER_ADMIN && id !== (req as any).user.organizationId) {
      throw new ConflictException('Access denied');
    }

    return this.organizationsService.getStatistics(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @RequestDecorator() req: Request,
  ) {
    // Ensure multi-tenant isolation (unless super admin)
    if ((req as any).user.role !== UserRole.SUPER_ADMIN && id !== (req as any).user.organizationId) {
      throw new ConflictException('Access denied');
    }

    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Patch(':id/settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update organization settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateSettings(
    @Param('id') id: string,
    @Body() settings: Record<string, any>,
    @RequestDecorator() req: Request,
  ) {
    // Ensure multi-tenant isolation (unless super admin)
    if ((req as any).user.role !== UserRole.SUPER_ADMIN && id !== (req as any).user.organizationId) {
      throw new ConflictException('Access denied');
    }

    return this.organizationsService.updateSettings(id, settings);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete organization' })
  @ApiResponse({ status: 204, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async remove(@Param('id') id: string) {
    await this.organizationsService.remove(id);
  }
}
