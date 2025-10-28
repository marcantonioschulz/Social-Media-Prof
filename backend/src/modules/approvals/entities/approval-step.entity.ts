import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApprovalWorkflow } from './approval-workflow.entity';
import { User } from '../../users/entities/user.entity';

export enum StepStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
}

@Entity('approval_steps')
export class ApprovalStep extends BaseEntity {
  @ApiProperty({ description: 'Step number in workflow' })
  @Column({ type: 'int' })
  stepNumber: number;

  @ApiProperty({ description: 'Step status', enum: StepStatus })
  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING,
  })
  status: StepStatus;

  @ApiProperty({ description: 'Approval/rejection comment', required: false })
  @Column({ type: 'text', nullable: true })
  comment: string;

  @ApiProperty({ description: 'Step completed at', required: false })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  // Workflow relationship
  @ApiProperty({ description: 'Workflow ID this step belongs to' })
  @Column({ type: 'uuid' })
  workflowId: string;

  @ApiProperty({ type: () => ApprovalWorkflow, description: 'Workflow this step belongs to' })
  @ManyToOne(() => ApprovalWorkflow, (workflow) => workflow.steps)
  @JoinColumn({ name: 'workflowId' })
  workflow: ApprovalWorkflow;

  // Approver
  @ApiProperty({ description: 'User ID who should approve this step' })
  @Column({ type: 'uuid' })
  approverId: string;

  @ApiProperty({ type: () => User, description: 'User who should approve this step' })
  @ManyToOne(() => User, (user) => user.approvalSteps)
  @JoinColumn({ name: 'approverId' })
  approver: User;
}
