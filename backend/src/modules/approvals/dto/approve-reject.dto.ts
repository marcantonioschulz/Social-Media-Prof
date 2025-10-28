import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ApproveRejectDto {
  @ApiProperty({
    description: 'Comment for approval or rejection',
    required: false,
    example: 'Looks good, approved!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
