import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ApprovalStepDto {
  @ApiProperty({ description: 'User ID who should approve this step' })
  @IsUUID()
  approverId: string;
}

export class CreateApprovalDto {
  @ApiProperty({ description: 'Post ID to create approval workflow for' })
  @IsUUID()
  postId: string;

  @ApiProperty({
    description: 'List of approval steps with approvers',
    type: [ApprovalStepDto],
    example: [
      { approverId: '123e4567-e89b-12d3-a456-426614174000' },
      { approverId: '123e4567-e89b-12d3-a456-426614174001' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  steps: ApprovalStepDto[];
}
