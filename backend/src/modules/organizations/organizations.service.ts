import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
  ) {}

  /**
   * Create a new organization
   */
  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    // Check if organization with slug already exists
    const existingOrg = await this.findBySlug(createOrganizationDto.slug);
    if (existingOrg) {
      throw new ConflictException('Organization with this slug already exists');
    }

    const organization = this.organizationsRepository.create(createOrganizationDto);
    return this.organizationsRepository.save(organization);
  }

  /**
   * Find all organizations
   */
  async findAll(includeInactive = false): Promise<Organization[]> {
    const query = this.organizationsRepository.createQueryBuilder('organization');

    if (!includeInactive) {
      query.where('organization.isActive = :isActive', { isActive: true });
    }

    return query
      .leftJoinAndSelect('organization.users', 'users')
      .orderBy('organization.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find organization by ID
   */
  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  /**
   * Find organization by slug
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    return this.organizationsRepository.findOne({
      where: { slug },
      relations: ['users'],
    });
  }

  /**
   * Update organization
   */
  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);

    // Check slug uniqueness if slug is being updated
    if (updateOrganizationDto.slug && updateOrganizationDto.slug !== organization.slug) {
      const existingOrg = await this.findBySlug(updateOrganizationDto.slug);
      if (existingOrg) {
        throw new ConflictException('Organization with this slug already exists');
      }
    }

    Object.assign(organization, updateOrganizationDto);
    return this.organizationsRepository.save(organization);
  }

  /**
   * Soft delete organization
   */
  async remove(id: string): Promise<void> {
    const organization = await this.findOne(id);
    await this.organizationsRepository.softRemove(organization);
  }

  /**
   * Get organization statistics
   */
  async getStatistics(organizationId: string): Promise<{
    totalUsers: number;
    totalPosts: number;
    totalAssets: number;
    storageUsed: number;
  }> {
    const organization = await this.organizationsRepository
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.users', 'users')
      .leftJoinAndSelect('organization.posts', 'posts')
      .leftJoinAndSelect('organization.assets', 'assets')
      .where('organization.id = :organizationId', { organizationId })
      .getOne();

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    // Calculate storage used (simplified - in real app would sum asset file sizes)
    const storageUsed = 0; // TODO: Calculate from assets

    return {
      totalUsers: organization.users?.length || 0,
      totalPosts: organization.posts?.length || 0,
      totalAssets: organization.assets?.length || 0,
      storageUsed,
    };
  }

  /**
   * Update organization settings
   */
  async updateSettings(id: string, settings: Record<string, any>): Promise<Organization> {
    const organization = await this.findOne(id);
    organization.settings = { ...organization.settings, ...settings };
    return this.organizationsRepository.save(organization);
  }

  /**
   * Check if organization has access to a resource (Multi-Tenant validation)
   */
  async validateOrganizationAccess(organizationId: string, resourceOrganizationId: string): boolean {
    if (organizationId !== resourceOrganizationId) {
      throw new ConflictException('Access denied: Resource belongs to another organization');
    }
    return true;
  }
}
