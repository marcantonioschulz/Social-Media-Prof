import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Create a new user with hashed password
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Find all users with optional organization filter
   */
  async findAll(organizationId?: string): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (organizationId) {
      query.where('user.organizationId = :organizationId', { organizationId });
    }

    return query
      .leftJoinAndSelect('user.organization', 'organization')
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find user by ID with multi-tenant isolation
   */
  async findOne(id: string, organizationId?: string): Promise<User> {
    const query = this.usersRepository.createQueryBuilder('user')
      .where('user.id = :id', { id });

    if (organizationId) {
      query.andWhere('user.organizationId = :organizationId', { organizationId });
    }

    const user = await query
      .leftJoinAndSelect('user.organization', 'organization')
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  /**
   * Update user with optional password hashing
   */
  async update(id: string, updateUserDto: UpdateUserDto, organizationId?: string): Promise<User> {
    const user = await this.findOne(id, organizationId);

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash password if it's being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  /**
   * Soft delete user
   */
  async remove(id: string, organizationId?: string): Promise<void> {
    const user = await this.findOne(id, organizationId);
    await this.usersRepository.softRemove(user);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Verify password
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Count users by organization
   */
  async countByOrganization(organizationId: string): Promise<number> {
    return this.usersRepository.count({
      where: { organizationId },
    });
  }
}
