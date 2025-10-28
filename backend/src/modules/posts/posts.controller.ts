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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Post as PostEntity, PostStatus } from './entities/post.entity';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() createPostDto: CreatePostDto, @RequestDecorator() req: Request): Promise<PostEntity> {
    const { organizationId, sub: userId } = (req as any).user;
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.postsService.create(
      createPostDto,
      organizationId,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts for organization' })
  @ApiQuery({ name: 'status', enum: PostStatus, required: false })
  @ApiQuery({ name: 'myPosts', type: Boolean, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of posts',
    type: [PostEntity],
  })
  async findAll(@RequestDecorator() req: Request, @Query('status') status?: PostStatus, @Query('myPosts') myPosts?: string): Promise<PostEntity[]> {
    const { organizationId, sub: userId } = (req as any).user;
    const filterUserId = myPosts === 'true' ? userId : undefined;

    return this.postsService.findAll(organizationId, filterUserId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiResponse({
    status: 200,
    description: 'Post details',
    type: PostEntity,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id') id: string, @RequestDecorator() req: Request): Promise<PostEntity> {
    const { organizationId } = (req as any).user;
    return this.postsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostEntity,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @RequestDecorator() req: Request,
  ): Promise<PostEntity> {
    const { organizationId, sub: userId } = (req as any).user;
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.postsService.update(id, updatePostDto, organizationId, userId, ipAddress, userAgent);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string, @RequestDecorator() req: Request): Promise<void> {
    const { organizationId, sub: userId } = (req as any).user;
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.postsService.remove(id, organizationId, userId, ipAddress, userAgent);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an approved post' })
  @ApiResponse({
    status: 200,
    description: 'Post published successfully',
    type: PostEntity,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 400, description: 'Post not approved' })
  async publish(@Param('id') id: string, @RequestDecorator() req: Request): Promise<PostEntity> {
    const { organizationId, sub: userId } = (req as any).user;
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.postsService.publish(id, organizationId, userId, ipAddress, userAgent);
  }
}
