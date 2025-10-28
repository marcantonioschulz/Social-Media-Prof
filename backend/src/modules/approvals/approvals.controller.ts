import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request as RequestDecorator,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovalWorkflow, WorkflowStatus } from './entities/approval-workflow.entity';
import { StepStatus } from './entities/approval-step.entity';

@ApiTags('approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post('workflows')
  @ApiOperation({ summary: 'Create a new approval workflow for a post' })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully',
    type: ApprovalWorkflow,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createWorkflow(
    @Body() createApprovalDto: CreateApprovalDto,
    @RequestDecorator() req: Request,
  ): Promise<ApprovalWorkflow> {
    const { organizationId, sub: userId } = (req as any).user;
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.approvalsService.createWorkflow(
      createApprovalDto,
      organizationId,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve current step of workflow' })
  @ApiResponse({
    status: 200,
    description: 'Step approved successfully',
    type: ApprovalWorkflow,
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to approve this step' })
  @ApiResponse({ status: 400, description: 'Invalid workflow state' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveRejectDto,
    @RequestDecorator() req: Request,
  ): Promise<ApprovalWorkflow> {
    const { organizationId, sub: userId } = (req as any).user;
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.approvalsService.approve(
      id,
      approveDto,
      organizationId,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject current step of workflow' })
  @ApiResponse({
    status: 200,
    description: 'Step rejected successfully',
    type: ApprovalWorkflow,
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to reject this step' })
  @ApiResponse({ status: 400, description: 'Invalid workflow state' })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: ApproveRejectDto,
    @RequestDecorator() req: Request,
  ): Promise<ApprovalWorkflow> {
    const { organizationId, sub: userId } = (req as any).user;
    const ipAddress = req.ip || (req as any).connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    return this.approvalsService.reject(
      id,
      rejectDto,
      organizationId,
      userId,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow status by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow details',
    type: ApprovalWorkflow,
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflowStatus(@Param('id') id: string, @RequestDecorator() req: Request): Promise<ApprovalWorkflow> {
    const { organizationId } = (req as any).user;
    return this.approvalsService.getWorkflowStatus(id, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows for organization' })
  @ApiQuery({ name: 'status', enum: WorkflowStatus, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of workflows',
    type: [ApprovalWorkflow],
  })
  async findAll(
    @RequestDecorator() req: Request,
    @Query('status') status?: WorkflowStatus,
  ): Promise<ApprovalWorkflow[]> {
    const { organizationId } = (req as any).user;
    return this.approvalsService.findAll(organizationId, status);
  }

  @Get('my-approvals')
  @ApiOperation({ summary: 'Get workflows where current user is an approver' })
  @ApiQuery({ name: 'status', enum: StepStatus, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of workflows pending approval from current user',
    type: [ApprovalWorkflow],
  })
  async findMyApprovals(
    @RequestDecorator() req: Request,
    @Query('status') status?: StepStatus,
  ): Promise<ApprovalWorkflow[]> {
    const { organizationId, sub: userId } = (req as any).user;
    return this.approvalsService.findByApprover(organizationId, userId, status);
  }
}
