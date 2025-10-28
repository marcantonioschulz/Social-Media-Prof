import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { UploadAssetDto } from './dto/upload-asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Asset } from './entities/asset.entity';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new asset' })
  @ApiBody({ type: UploadAssetDto })
  @ApiResponse({
    status: 201,
    description: 'Asset uploaded successfully',
    type: Asset,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadAssetDto: UploadAssetDto,
    @Request() req,
  ): Promise<Asset> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { organizationId, sub: userId } = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.assetsService.upload(
      file,
      uploadAssetDto,
      organizationId,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets for organization' })
  @ApiQuery({ name: 'postId', type: String, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of assets',
    type: [Asset],
  })
  async findAll(@Request() req, @Query('postId') postId?: string): Promise<Asset[]> {
    const { organizationId } = req.user;
    return this.assetsService.findAll(organizationId, postId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an asset by ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset details',
    type: Asset,
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id') id: string, @Request() req): Promise<Asset> {
    const { organizationId } = req.user;
    return this.assetsService.findOne(id, organizationId);
  }

  @Patch(':id/attach/:postId')
  @ApiOperation({ summary: 'Attach asset to a post' })
  @ApiResponse({
    status: 200,
    description: 'Asset attached to post successfully',
    type: Asset,
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async attachToPost(
    @Param('id') assetId: string,
    @Param('postId') postId: string,
    @Request() req,
  ): Promise<Asset> {
    const { organizationId, sub: userId } = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.assetsService.attachToPost(
      assetId,
      postId,
      organizationId,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an asset' })
  @ApiResponse({ status: 204, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const { organizationId, sub: userId } = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.assetsService.remove(id, organizationId, userId, ipAddress, userAgent);
  }

  @Post(':id/refresh-url')
  @ApiOperation({ summary: 'Refresh presigned URL for asset' })
  @ApiResponse({
    status: 200,
    description: 'URL refreshed successfully',
    type: Asset,
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async refreshUrl(@Param('id') id: string, @Request() req): Promise<Asset> {
    const { organizationId } = req.user;
    return this.assetsService.refreshUrl(id, organizationId);
  }
}
