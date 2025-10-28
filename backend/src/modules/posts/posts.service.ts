import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      organizationId,
      createdById: userId,
      status: PostStatus.DRAFT,
      scheduledAt: createPostDto.scheduledAt ? new Date(createPostDto.scheduledAt) : null,
    });

    const savedPost = await this.postRepository.save(post);

    // Audit log
    await this.auditService.log({
      action: AuditAction.POST_CREATED,
      entityType: 'Post',
      entityId: savedPost.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: { title: savedPost.title, platform: savedPost.platform },
      newValues: savedPost,
    });

    return savedPost;
  }

  async findAll(
    organizationId: string,
    userId?: string,
    status?: PostStatus,
  ): Promise<Post[]> {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .where('post.organizationId = :organizationId', { organizationId })
      .leftJoinAndSelect('post.createdBy', 'createdBy')
      .leftJoinAndSelect('post.assets', 'assets')
      .leftJoinAndSelect('post.approvalWorkflow', 'approvalWorkflow')
      .orderBy('post.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('post.createdById = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, organizationId: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, organizationId },
      relations: ['createdBy', 'assets', 'approvalWorkflow', 'approvalWorkflow.steps'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Post> {
    const post = await this.findOne(id, organizationId);

    // Check if user can update this post
    if (post.createdById !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Validate status transitions
    if (updatePostDto.status) {
      this.validateStatusTransition(post.status, updatePostDto.status);
    }

    const oldValues = { ...post };

    Object.assign(post, {
      ...updatePostDto,
      scheduledAt: updatePostDto.scheduledAt
        ? new Date(updatePostDto.scheduledAt)
        : post.scheduledAt,
    });

    const updatedPost = await this.postRepository.save(post);

    // Audit log
    await this.auditService.log({
      action: AuditAction.POST_UPDATED,
      entityType: 'Post',
      entityId: updatedPost.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: { title: updatedPost.title },
      oldValues,
      newValues: updatedPost,
    });

    return updatedPost;
  }

  async remove(
    id: string,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const post = await this.findOne(id, organizationId);

    // Check if user can delete this post
    if (post.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepository.softRemove(post);

    // Audit log
    await this.auditService.log({
      action: AuditAction.POST_DELETED,
      entityType: 'Post',
      entityId: id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: { title: post.title },
      oldValues: post,
    });
  }

  async publish(
    id: string,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Post> {
    const post = await this.findOne(id, organizationId);

    if (post.status !== PostStatus.APPROVED) {
      throw new BadRequestException('Only approved posts can be published');
    }

    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();

    const publishedPost = await this.postRepository.save(post);

    // Audit log
    await this.auditService.log({
      action: AuditAction.POST_PUBLISHED,
      entityType: 'Post',
      entityId: publishedPost.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: { title: publishedPost.title, publishedAt: publishedPost.publishedAt },
    });

    return publishedPost;
  }

  private validateStatusTransition(currentStatus: PostStatus, newStatus: PostStatus): void {
    const allowedTransitions: Record<PostStatus, PostStatus[]> = {
      [PostStatus.DRAFT]: [PostStatus.PENDING_APPROVAL, PostStatus.ARCHIVED],
      [PostStatus.PENDING_APPROVAL]: [PostStatus.APPROVED, PostStatus.REJECTED, PostStatus.DRAFT],
      [PostStatus.APPROVED]: [PostStatus.PUBLISHED, PostStatus.DRAFT],
      [PostStatus.REJECTED]: [PostStatus.DRAFT],
      [PostStatus.PUBLISHED]: [PostStatus.ARCHIVED],
      [PostStatus.ARCHIVED]: [PostStatus.DRAFT],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
