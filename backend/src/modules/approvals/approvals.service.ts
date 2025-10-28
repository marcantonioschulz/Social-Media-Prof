import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalWorkflow, WorkflowStatus } from './entities/approval-workflow.entity';
import { ApprovalStep, StepStatus } from './entities/approval-step.entity';
import { Post, PostStatus } from '../posts/entities/post.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(ApprovalWorkflow)
    private readonly workflowRepository: Repository<ApprovalWorkflow>,
    @InjectRepository(ApprovalStep)
    private readonly stepRepository: Repository<ApprovalStep>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly auditService: AuditService,
  ) {}

  async createWorkflow(
    createApprovalDto: CreateApprovalDto,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ApprovalWorkflow> {
    // Check if post exists and belongs to organization
    const post = await this.postRepository.findOne({
      where: { id: createApprovalDto.postId, organizationId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if post is in draft status
    if (post.status !== PostStatus.DRAFT) {
      throw new BadRequestException('Only draft posts can start approval workflow');
    }

    // Check if workflow already exists for this post
    const existingWorkflow = await this.workflowRepository.findOne({
      where: { postId: createApprovalDto.postId },
    });

    if (existingWorkflow) {
      throw new BadRequestException('Approval workflow already exists for this post');
    }

    // Create workflow
    const workflow = this.workflowRepository.create({
      postId: createApprovalDto.postId,
      status: WorkflowStatus.PENDING,
      currentStep: 0,
      totalSteps: createApprovalDto.steps.length,
      startedAt: new Date(),
    });

    const savedWorkflow = await this.workflowRepository.save(workflow);

    // Create steps
    const steps = createApprovalDto.steps.map((stepDto, index) =>
      this.stepRepository.create({
        workflowId: savedWorkflow.id,
        stepNumber: index + 1,
        approverId: stepDto.approverId,
        status: index === 0 ? StepStatus.PENDING : StepStatus.PENDING,
      }),
    );

    await this.stepRepository.save(steps);

    // Update post status
    post.status = PostStatus.PENDING_APPROVAL;
    await this.postRepository.save(post);

    // Update workflow status
    savedWorkflow.status = WorkflowStatus.IN_PROGRESS;
    await this.workflowRepository.save(savedWorkflow);

    // Audit log
    await this.auditService.log({
      action: AuditAction.APPROVAL_REQUESTED,
      entityType: 'ApprovalWorkflow',
      entityId: savedWorkflow.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: {
        postId: createApprovalDto.postId,
        totalSteps: createApprovalDto.steps.length,
      },
      newValues: savedWorkflow,
    });

    return this.getWorkflowStatus(savedWorkflow.id, organizationId);
  }

  async approve(
    workflowId: string,
    approveDto: ApproveRejectDto,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ApprovalWorkflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['post', 'steps', 'steps.approver'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Verify post belongs to organization
    if (workflow.post.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Check workflow status
    if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
      throw new BadRequestException('Workflow is not in progress');
    }

    // Find current pending step
    const currentStep = workflow.steps.find(
      (step) => step.stepNumber === workflow.currentStep + 1 && step.status === StepStatus.PENDING,
    );

    if (!currentStep) {
      throw new BadRequestException('No pending step found');
    }

    // Check if user is the approver for current step
    if (currentStep.approverId !== userId) {
      throw new ForbiddenException('You are not the approver for this step');
    }

    // Approve current step
    currentStep.status = StepStatus.APPROVED;
    currentStep.comment = approveDto.comment || null;
    currentStep.completedAt = new Date();
    await this.stepRepository.save(currentStep);

    // Update workflow
    workflow.currentStep += 1;

    // Check if all steps are approved
    if (workflow.currentStep >= workflow.totalSteps) {
      workflow.status = WorkflowStatus.APPROVED;
      workflow.completedAt = new Date();

      // Update post status
      workflow.post.status = PostStatus.APPROVED;
      await this.postRepository.save(workflow.post);
    }

    await this.workflowRepository.save(workflow);

    // Audit log
    await this.auditService.log({
      action: AuditAction.APPROVAL_APPROVED,
      entityType: 'ApprovalWorkflow',
      entityId: workflow.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: {
        postId: workflow.postId,
        stepNumber: currentStep.stepNumber,
        comment: approveDto.comment,
      },
    });

    return this.getWorkflowStatus(workflowId, organizationId);
  }

  async reject(
    workflowId: string,
    rejectDto: ApproveRejectDto,
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ApprovalWorkflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['post', 'steps', 'steps.approver'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Verify post belongs to organization
    if (workflow.post.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied');
    }

    // Check workflow status
    if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
      throw new BadRequestException('Workflow is not in progress');
    }

    // Find current pending step
    const currentStep = workflow.steps.find(
      (step) => step.stepNumber === workflow.currentStep + 1 && step.status === StepStatus.PENDING,
    );

    if (!currentStep) {
      throw new BadRequestException('No pending step found');
    }

    // Check if user is the approver for current step
    if (currentStep.approverId !== userId) {
      throw new ForbiddenException('You are not the approver for this step');
    }

    // Reject current step
    currentStep.status = StepStatus.REJECTED;
    currentStep.comment = rejectDto.comment || null;
    currentStep.completedAt = new Date();
    await this.stepRepository.save(currentStep);

    // Update workflow
    workflow.status = WorkflowStatus.REJECTED;
    workflow.completedAt = new Date();
    await this.workflowRepository.save(workflow);

    // Update post status
    workflow.post.status = PostStatus.REJECTED;
    await this.postRepository.save(workflow.post);

    // Audit log
    await this.auditService.log({
      action: AuditAction.APPROVAL_REJECTED,
      entityType: 'ApprovalWorkflow',
      entityId: workflow.id,
      organizationId,
      userId,
      ipAddress,
      userAgent,
      metadata: {
        postId: workflow.postId,
        stepNumber: currentStep.stepNumber,
        comment: rejectDto.comment,
      },
    });

    return this.getWorkflowStatus(workflowId, organizationId);
  }

  async getWorkflowStatus(workflowId: string, organizationId: string): Promise<ApprovalWorkflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['post', 'steps', 'steps.approver'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Verify post belongs to organization
    if (workflow.post.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied');
    }

    return workflow;
  }

  async findAll(organizationId: string, status?: WorkflowStatus): Promise<ApprovalWorkflow[]> {
    const queryBuilder = this.workflowRepository
      .createQueryBuilder('workflow')
      .leftJoinAndSelect('workflow.post', 'post')
      .leftJoinAndSelect('workflow.steps', 'steps')
      .leftJoinAndSelect('steps.approver', 'approver')
      .where('post.organizationId = :organizationId', { organizationId })
      .orderBy('workflow.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('workflow.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async findByApprover(
    organizationId: string,
    approverId: string,
    status?: StepStatus,
  ): Promise<ApprovalWorkflow[]> {
    const queryBuilder = this.workflowRepository
      .createQueryBuilder('workflow')
      .leftJoinAndSelect('workflow.post', 'post')
      .leftJoinAndSelect('workflow.steps', 'steps')
      .leftJoinAndSelect('steps.approver', 'approver')
      .where('post.organizationId = :organizationId', { organizationId })
      .andWhere('steps.approverId = :approverId', { approverId })
      .orderBy('workflow.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('steps.status = :status', { status });
    }

    return queryBuilder.getMany();
  }
}
