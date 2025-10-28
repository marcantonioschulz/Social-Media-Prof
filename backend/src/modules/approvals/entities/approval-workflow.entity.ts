import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Post } from '../../posts/entities/post.entity';
import { ApprovalStep } from './approval-step.entity';

export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('approval_workflows')
export class ApprovalWorkflow extends BaseEntity {
  @ApiProperty({ description: 'Workflow status', enum: WorkflowStatus })
  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.PENDING,
  })
  status: WorkflowStatus;

  @ApiProperty({ description: 'Current step number' })
  @Column({ type: 'int', default: 0 })
  currentStep: number;

  @ApiProperty({ description: 'Total number of steps' })
  @Column({ type: 'int' })
  totalSteps: number;

  @ApiProperty({ description: 'Workflow started at', required: false })
  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @ApiProperty({ description: 'Workflow completed at', required: false })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // Post relationship
  @ApiProperty({ description: 'Post ID this workflow belongs to' })
  @Column({ type: 'uuid' })
  postId: string;

  @ApiProperty({ type: () => Post, description: 'Post this workflow belongs to' })
  @OneToOne(() => Post, (post) => post.approvalWorkflow)
  @JoinColumn({ name: 'postId' })
  post: Post;

  // Steps
  @ApiProperty({ type: () => [ApprovalStep], description: 'Approval steps in this workflow' })
  @OneToMany(() => ApprovalStep, (step) => step.workflow, { cascade: true })
  steps: ApprovalStep[];
}
